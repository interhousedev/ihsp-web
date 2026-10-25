import { describe, expect, it } from "bun:test"
import { ApiError, networkError, postAnnotationsSync, type Annotation, type AnnotationInput } from "@ihsp/api"
import { libIds, setLibraryActor } from "@ihsp/test-utils"
import { AnnotationQueue, MAX_SYNC_CHANGES, type SyncSender } from "./annotation-queue"

class FakeStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}

const asStorage = (storage: FakeStorage) => storage as unknown as Storage

function input(clientId: string, overrides: Partial<AnnotationInput> = {}): AnnotationInput {
  return {
    client_id: clientId,
    item_id: libIds.bookPhysics10,
    file_id: libIds.filePhysics10,
    kind: "highlight",
    locator: { page: 3 },
    quote: "A quote",
    note: null,
    color: "yellow",
    ...overrides,
  }
}

function saved(source: AnnotationInput): Annotation {
  return {
    ...source,
    id: `server-${source.client_id}`,
    quote: source.quote ?? null,
    note: source.note ?? null,
    updated_at: "2026-10-08T10:00:00Z",
  }
}

/** A server that stores by `client_id`, like the real one. */
function fakeServer() {
  const stored = new Map<string, Annotation>()
  const calls: Parameters<SyncSender>[0][] = []
  const send: SyncSender = async (body) => {
    calls.push(body)
    const items = body.upserts.map((upsert) => {
      const existing = stored.get(upsert.client_id) ?? saved(upsert)
      stored.set(upsert.client_id, existing)
      return existing
    })
    for (const id of body.deletes) {
      for (const [key, value] of stored) if (value.id === id || key === id) stored.delete(key)
    }
    return { items }
  }
  return { stored, calls, send }
}

describe("AnnotationQueue", () => {
  it("sends the waiting changes and empties the queue", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a"))
    queue.upsert(input("b", { kind: "bookmark", quote: null }))

    const result = await queue.flush(server.send)

    expect(result.synced.map((item) => item.client_id)).toEqual(["a", "b"])
    expect(result.stalled).toBe(false)
    expect(queue.entries).toHaveLength(0)
    expect(server.stored.size).toBe(2)
  })

  it("keeps everything when the network is down and sends it later without copies", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a"))
    let down = true
    const flaky: SyncSender = async (body) => {
      if (down) throw networkError(new Error("offline"))
      return server.send(body)
    }

    const first = await queue.flush(flaky)
    down = false
    const second = await queue.flush(flaky)

    expect(first.stalled).toBe(true)
    expect(first.synced).toEqual([])
    expect(second.synced).toHaveLength(1)
    expect(server.stored.size).toBe(1)
  })

  it("is idempotent when a response is lost after the server stored the change", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a", { note: "first" }))
    let lose = true
    const lossy: SyncSender = async (body) => {
      const response = await server.send(body)
      if (lose) {
        lose = false
        throw networkError(new Error("response lost"))
      }
      return response
    }

    await queue.flush(lossy)
    await queue.flush(lossy)

    expect(server.calls).toHaveLength(2)
    expect(server.stored.size).toBe(1)
    expect(queue.entries).toHaveLength(0)
  })

  it("replaces a queued change of the same client_id", () => {
    const queue = new AnnotationQueue({ storage: null })
    queue.upsert(input("a", { note: "one" }))
    queue.upsert(input("a", { note: "two" }))

    expect(queue.entries).toHaveLength(1)
    expect(queue.entries[0]).toMatchObject({ kind: "upsert", input: { note: "two" } })
  })

  it("drops a create that was never sent when the user deletes it", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a"))

    queue.delete({ clientId: "a" })
    await queue.flush(server.send)

    expect(queue.entries).toHaveLength(0)
    expect(server.calls).toHaveLength(0)
  })

  it("sends the server id of an annotation that exists", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    server.stored.set("known", saved(input("known")))

    queue.delete({ id: "server-known", clientId: "known" })
    await queue.flush(server.send)

    expect(server.calls[0]?.deletes).toEqual(["server-known"])
    expect(server.stored.size).toBe(0)
  })

  it("sends at most 200 changes in one request", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    for (let index = 0; index < MAX_SYNC_CHANGES + 5; index += 1) queue.upsert(input(`c-${index}`))

    await queue.flush(server.send)

    expect(server.calls.map((call) => call.upserts.length)).toEqual([MAX_SYNC_CHANGES, 5])
  })

  it("parks only the refused change and sends the others", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("good-1"))
    queue.upsert(input("bad"))
    queue.upsert(input("good-2"))
    const picky: SyncSender = async (body) => {
      if (body.upserts.some((upsert) => upsert.client_id === "bad")) {
        throw new ApiError({ type: "common/request-validation", status: 422, title: "invalid" })
      }
      return server.send(body)
    }

    const result = await queue.flush(picky)

    expect(result.rejected).toEqual(["bad"])
    expect(result.synced.map((item) => item.client_id)).toEqual(["good-1", "good-2"])
    expect(queue.entries).toHaveLength(1)
    expect(queue.pending).toBe(0)
    expect(queue.entries[0]).toMatchObject({ rejected: "common/request-validation" })
  })

  it("lets the user retry or discard a parked change", async () => {
    const queue = new AnnotationQueue({ storage: null })
    queue.upsert(input("bad"))
    await queue.flush(async () => {
      throw new ApiError({ type: "library/not-found", status: 404, title: "gone" })
    })
    expect(queue.pending).toBe(0)

    queue.retry("bad")
    expect(queue.pending).toBe(1)

    queue.discard("bad")
    expect(queue.entries).toHaveLength(0)
  })

  it("stops on a server error and keeps the queue", async () => {
    const queue = new AnnotationQueue({ storage: null })
    queue.upsert(input("a"))

    const result = await queue.flush(async () => {
      throw new ApiError({ type: "common/internal", status: 503, title: "down" })
    })

    expect(result.stalled).toBe(true)
    expect(queue.pending).toBe(1)
  })

  it("shares one running flush", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a"))

    const [first, second] = await Promise.all([queue.flush(server.send), queue.flush(server.send)])

    expect(first).toBe(second)
    expect(server.calls).toHaveLength(1)
  })

  it("keeps changes made while a flush runs", async () => {
    const queue = new AnnotationQueue({ storage: null })
    const server = fakeServer()
    queue.upsert(input("a", { note: "old" }))
    let edited = false
    const slow: SyncSender = async (body) => {
      if (!edited) {
        edited = true
        queue.upsert(input("a", { note: "newer" }))
      }
      return server.send(body)
    }

    await queue.flush(slow)

    expect(server.calls.map((call) => call.upserts[0]?.note)).toEqual(["old", "newer"])
    expect(queue.entries).toHaveLength(0)
  })

  it("survives a reload through sessionStorage and ignores damaged data", () => {
    const storage = new FakeStorage()
    const first = new AnnotationQueue({ storage: asStorage(storage) })
    first.upsert(input("a"))
    first.delete({ id: "server-b" })

    const second = new AnnotationQueue({ storage: asStorage(storage) })
    expect(second.entries).toHaveLength(2)

    storage.data.set("ihsp.library.annotation-queue", "{broken")
    expect(new AnnotationQueue({ storage: asStorage(storage) }).entries).toEqual([])
    storage.data.set("ihsp.library.annotation-queue", JSON.stringify([{ kind: "nope" }, 4, null]))
    expect(new AnnotationQueue({ storage: asStorage(storage) }).entries).toEqual([])
  })

  it("tells listeners when it changes", () => {
    const queue = new AnnotationQueue({ storage: null })
    let calls = 0
    const stop = queue.subscribe(() => (calls += 1))

    queue.upsert(input("a"))
    queue.clear()
    stop()
    queue.upsert(input("b"))

    expect(calls).toBe(2)
  })
})

describe("AnnotationQueue against the mocked API", () => {
  it("flushing the same change twice leaves one annotation on the server", async () => {
    setLibraryActor("student")
    const queue = new AnnotationQueue({ storage: null })
    const change = input("11111111-1111-4111-8111-111111111111", { locator: { page: 5 }, quote: "Twice" })
    queue.upsert(change)

    const first = await queue.flush((body) => postAnnotationsSync(body))
    queue.upsert(change)
    const second = await queue.flush((body) => postAnnotationsSync(body))

    expect(first.synced).toHaveLength(1)
    expect(second.synced).toHaveLength(1)
    expect(second.synced[0]?.id).toBe(first.synced[0]!.id)
  })
})
