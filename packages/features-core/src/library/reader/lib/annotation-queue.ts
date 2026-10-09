import { isApiError, isNetworkError, type Annotation, type AnnotationInput, type AnnotationsSyncBody } from "@ihsp/api"

// A retry queue for annotation changes that could not reach the server (docs/reference/study-library.md § 3.10 without
// the offline store: it lives in memory and in `sessionStorage`, never in IndexedDB). Every create carries a
// client-generated `client_id`, and the server de-duplicates by it, so sending a change twice (a response got lost)
// never makes a copy: the flush is idempotent.

export type QueuedChange =
  | { kind: "upsert"; input: AnnotationInput; /** When the change was made (ISO). */ at?: string; rejected?: string }
  | { kind: "delete"; id: string; rejected?: string }

/** Sends one batch (`POST /me/library/annotations/sync`). */
export type SyncSender = (body: AnnotationsSyncBody) => Promise<{ items: Annotation[] }>

export type FlushResult = {
  /** Annotations the server confirmed (with their ids). */
  synced: Annotation[]
  /** Ids (or `client_id`s) of deletes the server confirmed. */
  deleted: string[]
  /** `client_id`s (or ids) the server refused for good; they stay in the queue until retried or discarded. */
  rejected: string[]
  /** The network or the server was unreachable: the rest of the queue waits. */
  stalled: boolean
}

const STORAGE_KEY = "ihsp.library.annotation-queue"
/** The sync endpoint takes at most 200 changes. */
export const MAX_SYNC_CHANGES = 200

function keyOf(change: QueuedChange): string {
  return change.kind === "upsert" ? change.input.client_id : change.id
}

/** A failure that another attempt may fix: no network, a server error, a rate limit, an expired session. */
export function isRetryable(error: unknown): boolean {
  if (isNetworkError(error)) return true
  if (!isApiError(error)) return true
  return error.status >= 500 || error.status === 401 || error.status === 408 || error.status === 429
}

function readStorage(storage: Storage | null, key: string): QueuedChange[] {
  if (!storage) return []
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]")
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is QueuedChange =>
        !!entry &&
        typeof entry === "object" &&
        ((entry.kind === "upsert" && typeof entry.input?.client_id === "string") ||
          (entry.kind === "delete" && typeof entry.id === "string")),
    )
  } catch {
    return []
  }
}

export function sessionStorageOrNull(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage
  } catch {
    return null
  }
}

export class AnnotationQueue {
  #entries: QueuedChange[]
  #storage: Storage | null
  #key: string
  #listeners = new Set<() => void>()
  #flushing: Promise<FlushResult> | null = null
  #version = 0

  constructor(options: { storage?: Storage | null; key?: string } = {}) {
    this.#storage = options.storage === undefined ? sessionStorageOrNull() : options.storage
    this.#key = options.key ?? STORAGE_KEY
    this.#entries = readStorage(this.#storage, this.#key)
  }

  get entries(): readonly QueuedChange[] {
    return this.#entries
  }

  /** Grows with every change: a stable snapshot for `useSyncExternalStore`. */
  get version(): number {
    return this.#version
  }

  /** Changes that wait for a flush (the rejected ones wait for the user). */
  get pending(): number {
    return this.#entries.filter((entry) => !entry.rejected).length
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /** Queues a create or an edit; a second change of the same `client_id` replaces the first. */
  upsert(input: AnnotationInput): void {
    const next: QueuedChange = { kind: "upsert", input, at: new Date().toISOString() }
    const index = this.#entries.findIndex(
      (entry) => entry.kind === "upsert" && entry.input.client_id === input.client_id,
    )
    if (index >= 0) this.#entries[index] = next
    else this.#entries.push(next)
    this.#changed()
  }

  /**
   * Queues a delete. A queued create of the same `clientId` is dropped (it never needs to be sent). When the server
   * knows the annotation (`id` is its server id) the delete goes into the next batch.
   */
  delete(target: { id?: string | null; clientId?: string | null }): void {
    const { id, clientId } = target
    this.#entries = this.#entries.filter(
      (entry) => !(entry.kind === "upsert" && !!clientId && entry.input.client_id === clientId),
    )
    if (id && !this.#entries.some((entry) => entry.kind === "delete" && entry.id === id)) {
      this.#entries.push({ kind: "delete", id })
    }
    this.#changed()
  }

  /** The queued create for a `client_id`, if it still waits. */
  find(clientId: string): QueuedChange | undefined {
    return this.#entries.find((entry) => keyOf(entry) === clientId)
  }

  /** Parks a change the server refused at once (a create that failed with a 4xx): it waits for Retry or Discard. */
  markRejected(key: string, reason: string): void {
    this.#entries = this.#entries.map((entry) =>
      keyOf(entry) === key ? ({ ...entry, rejected: reason } as QueuedChange) : entry,
    )
    this.#changed()
  }

  /** Puts a refused change back into the line (the user pressed Retry). */
  retry(key: string): void {
    this.#entries = this.#entries.map((entry) => {
      if (keyOf(entry) !== key || !entry.rejected) return entry
      const { rejected: _rejected, ...rest } = entry
      return rest as QueuedChange
    })
    this.#changed()
  }

  /** Forgets a change for good. */
  discard(key: string): void {
    this.#entries = this.#entries.filter((entry) => keyOf(entry) !== key)
    this.#changed()
  }

  clear(): void {
    this.#entries = []
    this.#changed()
  }

  /**
   * Sends the waiting changes in batches of at most 200. Single flight: a flush that is running is shared. A network or
   * server failure stops the flush and keeps everything; a refusal (4xx) of a batch is narrowed down by sending its
   * changes one by one, and only the refused ones are parked as `rejected`.
   */
  flush(send: SyncSender): Promise<FlushResult> {
    if (this.#flushing) return this.#flushing
    const run = this.#run(send).finally(() => {
      this.#flushing = null
    })
    this.#flushing = run
    return run
  }

  async #run(send: SyncSender): Promise<FlushResult> {
    const result: FlushResult = { synced: [], deleted: [], rejected: [], stalled: false }
    for (;;) {
      const batch = this.#entries.filter((entry) => !entry.rejected).slice(0, MAX_SYNC_CHANGES)
      if (batch.length === 0) return result
      const outcome = await this.#sendBatch(send, batch, result)
      if (outcome === "stalled") {
        result.stalled = true
        return result
      }
    }
  }

  async #sendBatch(send: SyncSender, batch: QueuedChange[], result: FlushResult): Promise<"done" | "stalled"> {
    try {
      const response = await send({
        upserts: batch.flatMap((entry) => (entry.kind === "upsert" ? [entry.input] : [])),
        deletes: batch.flatMap((entry) => (entry.kind === "delete" ? [entry.id] : [])),
      })
      result.synced.push(...response.items)
      result.deleted.push(...batch.flatMap((entry) => (entry.kind === "delete" ? [entry.id] : [])))
      // Entries are replaced, never edited, so identity tells which ones were not changed while the call ran.
      this.#entries = this.#entries.filter((entry) => !batch.includes(entry))
      this.#changed()
      return "done"
    } catch (error) {
      if (isRetryable(error)) return "stalled"
      if (batch.length > 1) {
        for (const entry of batch) {
          if ((await this.#sendBatch(send, [entry], result)) === "stalled") return "stalled"
        }
        return "done"
      }
      const [entry] = batch
      const reason = isApiError(error) ? error.type : "error"
      this.#entries = this.#entries.map((current) =>
        current === entry ? ({ ...current, rejected: reason } as QueuedChange) : current,
      )
      result.rejected.push(keyOf(entry!))
      this.#changed()
      return "done"
    }
  }

  #changed(): void {
    this.#version += 1
    if (this.#storage) {
      try {
        if (this.#entries.length === 0) this.#storage.removeItem(this.#key)
        else this.#storage.setItem(this.#key, JSON.stringify(this.#entries))
      } catch {
        // Full or blocked storage: the queue still works for this page view.
      }
    }
    for (const listener of this.#listeners) listener()
  }
}

let shared: AnnotationQueue | null = null

/** The queue of this tab (backed by `sessionStorage`, so a reload keeps the unsent changes). */
export function getAnnotationQueue(): AnnotationQueue {
  shared ??= new AnnotationQueue()
  return shared
}

/** Test helper: forget the shared queue. */
export function resetAnnotationQueue(): void {
  shared = null
}
