"use client"

import {
  deleteAnnotation,
  getAnnotations,
  isApiError,
  keys,
  patchAnnotation,
  postAnnotation,
  postAnnotationsSync,
  type Annotation,
  type AnnotationColor,
  type AnnotationInput,
  type AnnotationKind,
} from "@ihsp/api"
import { useErrorMessage } from "@ihsp/i18n"
import { useOnline } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { getAnnotationQueue, isRetryable, type FlushResult } from "./lib/annotation-queue"
import type { Locator } from "./lib/locator"

// The annotations (highlights, notes, bookmarks) of one file, with the writes the reader needs:
// - a create gets a client-generated `client_id` and appears at once (optimistic insert);
// - if the server cannot be reached it waits in the retry queue (`lib/annotation-queue.ts`), stays visible, and is sent
//   again on `online`, on every minute and on Retry; the server de-duplicates by `client_id`;
// - an edit or a delete is applied at once and rolled back with a message when the server refuses.

export type SyncState = "synced" | "sending" | "queued" | "failed"
export type ViewAnnotation = Annotation & { sync: SyncState }

export type AnnotationDraft = {
  kind: AnnotationKind
  locator: Locator
  quote?: string | null
  note?: string | null
  color: AnnotationColor
}

const LOCAL_PREFIX = "local-"
const PAGE_SIZE = 100
const FLUSH_INTERVAL_MS = 60_000

export const isLocalAnnotation = (annotation: Pick<Annotation, "id">) => annotation.id.startsWith(LOCAL_PREFIX)

/** A random UUID v4 (`crypto.randomUUID` where the browser has it). */
export function newClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof crypto !== "undefined") crypto.getRandomValues(bytes)
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** All annotations of an item, following the cursor. */
async function fetchAllOfItem(itemId: string, signal?: AbortSignal): Promise<Annotation[]> {
  const all: Annotation[] = []
  let cursor: string | undefined
  do {
    const page = await getAnnotations({ item_id: itemId, limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }, { signal })
    all.push(...page.items)
    cursor = page.next_cursor ?? undefined
  } while (cursor)
  return all
}

const toInput = (annotation: Annotation): AnnotationInput => ({
  client_id: annotation.client_id,
  item_id: annotation.item_id,
  file_id: annotation.file_id,
  kind: annotation.kind,
  locator: annotation.locator,
  quote: annotation.quote,
  note: annotation.note,
  color: annotation.color,
})

export function useReaderAnnotations({
  itemId,
  fileId,
  enabled,
}: {
  itemId: string
  fileId: string
  /** False for visitors: no notes without an account. */
  enabled: boolean
}) {
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  const online = useOnline()
  const queue = getAnnotationQueue()
  const queueVersion = useSyncExternalStore(
    (listener) => queue.subscribe(listener),
    () => queue.version,
    () => 0,
  )
  const [sending, setSending] = useState<ReadonlySet<string>>(new Set())

  const queryKey = useMemo(() => keys.library.annotations({ item_id: itemId, scope: "item" }), [itemId])
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchAllOfItem(itemId, signal),
    enabled,
  })

  const edit = useCallback(
    (change: (current: Annotation[]) => Annotation[]) => {
      queryClient.setQueryData<Annotation[]>(queryKey, (current) => change(current ?? []))
    },
    [queryClient, queryKey],
  )
  const refreshLists = useCallback(() => {
    // The notes tab of My library reads the same data in other shapes.
    void queryClient.invalidateQueries({ queryKey: keys.library.me() })
  }, [queryClient])

  const mark = useCallback((clientId: string, on: boolean) => {
    setSending((current) => {
      const next = new Set(current)
      if (on) next.add(clientId)
      else next.delete(clientId)
      return next
    })
  }, [])

  // - - - Sending what waits in the queue - - -

  const flushing = useRef(false)
  const flush = useCallback(async (): Promise<FlushResult | null> => {
    if (queue.pending === 0 || flushing.current) return null
    flushing.current = true
    try {
      const result = await queue.flush((body) => postAnnotationsSync(body))
      if (result.synced.length > 0) {
        edit((current) => {
          const byClient = new Map(result.synced.map((annotation) => [annotation.client_id, annotation]))
          const replaced = current.map((annotation) => byClient.get(annotation.client_id) ?? annotation)
          const known = new Set(replaced.map((annotation) => annotation.client_id))
          const fresh = result.synced.filter(
            (annotation) => annotation.item_id === itemId && !known.has(annotation.client_id),
          )
          return [...fresh, ...replaced]
        })
      }
      if (result.synced.length > 0 || result.deleted.length > 0) refreshLists()
      return result
    } finally {
      flushing.current = false
    }
    // oxlint-disable-next-line react/memo-dependencies -- `queue` is the tab-wide singleton
  }, [queue, edit, itemId, refreshLists])

  useEffect(() => {
    if (!enabled || !online) return
    void flush()
    const timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [enabled, online, flush])

  // - - - Writes - - -

  const create = useCallback(
    async (draft: AnnotationDraft): Promise<ViewAnnotation | null> => {
      if (!enabled) return null
      const clientId = newClientId()
      const input: AnnotationInput = {
        client_id: clientId,
        item_id: itemId,
        file_id: fileId,
        kind: draft.kind,
        locator: draft.locator,
        quote: draft.quote ?? null,
        note: draft.note ?? null,
        color: draft.color,
      }
      const optimistic: Annotation = {
        ...input,
        id: `${LOCAL_PREFIX}${clientId}`,
        quote: input.quote ?? null,
        note: input.note ?? null,
        updated_at: new Date().toISOString(),
      }
      edit((current) => [optimistic, ...current])
      mark(clientId, true)
      try {
        const saved = await postAnnotation(input)
        edit((current) => current.map((annotation) => (annotation.client_id === clientId ? saved : annotation)))
        refreshLists()
        return { ...saved, sync: "synced" }
      } catch (error) {
        // It stays visible: the queue sends it again, and a refusal waits for Retry or Discard.
        queue.upsert(input)
        if (!isRetryable(error)) {
          queue.markRejected(clientId, isApiError(error) ? error.type : "error")
          toast.error(errorMessage(error))
        }
        return { ...optimistic, sync: isRetryable(error) ? "queued" : "failed" }
      } finally {
        mark(clientId, false)
      }
    },
    [enabled, itemId, fileId, edit, queue, errorMessage, refreshLists, mark],
  )

  const update = useCallback(
    async (annotation: Annotation, patch: { note?: string | null; color?: AnnotationColor }) => {
      const before = annotation
      const after: Annotation = { ...annotation, ...patch, updated_at: new Date().toISOString() }
      edit((current) => current.map((entry) => (entry.id === annotation.id ? after : entry)))
      if (isLocalAnnotation(annotation)) {
        // Never reached the server: the queued create carries the new values.
        queue.upsert(toInput(after))
        return
      }
      try {
        const saved = await patchAnnotation(annotation.id, patch)
        edit((current) => current.map((entry) => (entry.id === annotation.id ? saved : entry)))
        refreshLists()
      } catch (error) {
        edit((current) => current.map((entry) => (entry.id === annotation.id ? before : entry)))
        toast.error(errorMessage(error))
      }
    },
    [edit, queue, errorMessage, refreshLists],
  )

  const remove = useCallback(
    async (annotation: Annotation) => {
      edit((current) => current.filter((entry) => entry.id !== annotation.id))
      if (isLocalAnnotation(annotation)) {
        queue.delete({ clientId: annotation.client_id })
        return
      }
      try {
        await deleteAnnotation(annotation.id)
        refreshLists()
      } catch (error) {
        if (isRetryable(error)) {
          queue.delete({ id: annotation.id, clientId: annotation.client_id })
          return
        }
        edit((current) => [annotation, ...current])
        toast.error(errorMessage(error))
      }
    },
    [edit, queue, errorMessage, refreshLists],
  )

  const retry = useCallback(
    async (annotation: Annotation) => {
      queue.retry(annotation.client_id)
      await flush()
    },
    [queue, flush],
  )

  const discard = useCallback(
    (annotation: Annotation) => {
      queue.discard(annotation.client_id)
      edit((current) => current.filter((entry) => entry.id !== annotation.id))
    },
    [queue, edit],
  )

  const annotations = useMemo<ViewAnnotation[]>(() => {
    void queueVersion
    const known = new Set((query.data ?? []).map((annotation) => annotation.client_id))
    // A change that waits in the queue stays on screen even if the list was refetched without it.
    const waiting: Annotation[] = queue.entries.flatMap((entry) =>
      entry.kind === "upsert" && entry.input.item_id === itemId && !known.has(entry.input.client_id)
        ? [
            {
              ...entry.input,
              id: `${LOCAL_PREFIX}${entry.input.client_id}`,
              quote: entry.input.quote ?? null,
              note: entry.input.note ?? null,
              updated_at: entry.at ?? "",
            },
          ]
        : [],
    )
    return [...waiting, ...(query.data ?? [])].map((annotation) => {
      if (!isLocalAnnotation(annotation)) return { ...annotation, sync: "synced" }
      const entry = queue.find(annotation.client_id)
      const sync: SyncState = entry?.rejected
        ? "failed"
        : entry
          ? "queued"
          : sending.has(annotation.client_id)
            ? "sending"
            : "queued"
      return { ...annotation, sync }
    })
    // oxlint-disable-next-line react/memo-dependencies -- `queueVersion` says that the singleton queue changed
  }, [query.data, queue, queueVersion, sending, itemId])

  return {
    annotations,
    isLoading: enabled && query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    online,
    /** Changes that wait for the network (shown as a badge). */
    waiting: queue.pending,
    create,
    update,
    remove,
    retry,
    discard,
    flush,
  }
}

export type ReaderAnnotations = ReturnType<typeof useReaderAnnotations>
