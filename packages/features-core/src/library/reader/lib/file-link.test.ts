import { describe, expect, it } from "bun:test"
import type { ItemFileUrl } from "@ihsp/api"
import { createFileLinks, fetchFile, FileFetchError, parseContentRange, type FetchLike } from "./file-link"

function link(url: string, expiresInMs: number, now: number): ItemFileUrl {
  return {
    url,
    expires_at: new Date(now + expiresInMs).toISOString(),
    content_type: "application/pdf",
    byte_size: 1000,
  }
}

const forbidden: FetchLike = async () => new Response("no", { status: 403 })

describe("createFileLinks", () => {
  it("reuses a link until a minute before it expires", async () => {
    let now = Date.parse("2026-10-08T10:00:00Z")
    let requests = 0
    const links = createFileLinks(
      async () => link(`https://s/${++requests}`, 15 * 60_000, now),
      () => now,
    )

    expect((await links.get()).url).toBe("https://s/1")
    now += 10 * 60_000
    expect((await links.get()).url).toBe("https://s/1")
    now += 4.5 * 60_000
    expect((await links.get()).url).toBe("https://s/2")
  })

  it("shares one request between concurrent callers", async () => {
    const now = Date.now()
    let requests = 0
    const links = createFileLinks(
      async () => link(`https://s/${++requests}`, 900_000, now),
      () => now,
    )

    const [a, b] = await Promise.all([links.get(), links.renew()])

    expect(a.url).toBe(b.url)
    expect(requests).toBe(1)
  })
})

describe("fetchFile", () => {
  it("renews the link on a 403 and repeats the request once", async () => {
    const now = Date.now()
    let issued = 0
    const links = createFileLinks(
      async () => link(`https://s/file?sig=${++issued}`, 900_000, now),
      () => now,
    )
    const seen: string[] = []
    const fetchFn: FetchLike = async (url) => {
      seen.push(url)
      return new Response("body", { status: url.endsWith("sig=1") ? 403 : 200 })
    }

    const response = await fetchFile(links, {}, fetchFn)

    expect(await response.text()).toBe("body")
    expect(seen).toEqual(["https://s/file?sig=1", "https://s/file?sig=2"])
  })

  it("gives up after the second 403 and reports the status", async () => {
    const now = Date.now()
    const links = createFileLinks(
      async () => link("https://s/f", 900_000, now),
      () => now,
    )

    await expect(fetchFile(links, {}, forbidden)).rejects.toMatchObject({ name: "FileFetchError", status: 403 })
  })

  it("reports other statuses at once and a dead network as status 0", async () => {
    const now = Date.now()
    const links = createFileLinks(
      async () => link("https://s/f", 900_000, now),
      () => now,
    )

    await expect(fetchFile(links, {}, async () => new Response("", { status: 404 }))).rejects.toBeInstanceOf(
      FileFetchError,
    )
    await expect(
      fetchFile(links, {}, async () => {
        throw new TypeError("Failed to fetch")
      }),
    ).rejects.toMatchObject({ status: 0 })
  })

  it("sends no credentials and no referrer to the storage", async () => {
    const now = Date.now()
    const links = createFileLinks(
      async () => link("https://s/f", 900_000, now),
      () => now,
    )
    let seenInit: RequestInit | undefined
    await fetchFile(links, { headers: { Range: "bytes=0-9" } }, async (_url, init) => {
      seenInit = init
      return new Response("x")
    })

    expect(seenInit).toMatchObject({
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Range: "bytes=0-9" },
    })
  })
})

describe("parseContentRange", () => {
  it("reads start, end and total", () => {
    expect(parseContentRange("bytes 0-65535/1048576")).toEqual({ start: 0, end: 65535, total: 1048576 })
  })

  it("refuses anything else", () => {
    for (const bad of [null, "", "bytes */100", "items 0-1/2"]) expect(parseContentRange(bad)).toBeNull()
  })
})
