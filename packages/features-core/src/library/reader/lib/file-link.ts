import { getLibraryFileUrl, type ItemFileUrl } from "@ihsp/api"

// The reader opens files through a presigned URL that is valid for 15 minutes (`GET /library/items/{id}/files/{fid}/url`,
// docs/reference/study-library.md § 3.8). A long reading session outlives it: the storage then answers `403`, and the
// reader asks for a new URL and repeats the request once.

export interface FileLinks {
  /** The current link; a new one when it is about to expire. */
  get(): Promise<ItemFileUrl>
  /** A fresh link (after a `403`). Concurrent callers share one request. */
  renew(): Promise<ItemFileUrl>
}

/** Renew a minute early so a request never starts with a link that dies on the way. */
const EARLY_MS = 60_000

type FetchLink = () => Promise<ItemFileUrl>

export function createFileLinks(fetchLink: FetchLink, now: () => number = () => Date.now()): FileLinks {
  let current: ItemFileUrl | null = null
  let pending: Promise<ItemFileUrl> | null = null

  function load(): Promise<ItemFileUrl> {
    pending ??= fetchLink()
      .then((link) => {
        current = link
        return link
      })
      .finally(() => {
        pending = null
      })
    return pending
  }

  return {
    get() {
      if (current && Date.parse(current.expires_at) - now() > EARLY_MS) return Promise.resolve(current)
      return load()
    },
    renew() {
      current = null
      return load()
    },
  }
}

/** The links of one file of an item, as the reader needs them (`inline=1`: the reading right, not the download right). */
export function itemFileLinks(itemId: string, fileId: string): FileLinks {
  return createFileLinks(() => getLibraryFileUrl(itemId, fileId, { inline: true }))
}

/** A failed storage request. `status` is the HTTP status, `0` when the request never reached the storage. */
export class FileFetchError extends Error {
  readonly status: number
  constructor(status: number, message?: string) {
    super(message ?? `Storage answered ${status}`)
    this.name = "FileFetchError"
    this.status = status
  }
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/**
 * GET of the file with the current link. A `403` (or `401`, as some stores answer for an expired signature) renews the
 * link and tries once more. Other failures throw a `FileFetchError`.
 */
export async function fetchFile(
  links: FileLinks,
  init: RequestInit = {},
  fetchFn: FetchLike = (input, options) => fetch(input, options),
): Promise<Response> {
  let link = await links.get()
  for (let attempt = 0; ; attempt += 1) {
    let response: Response
    try {
      response = await fetchFn(link.url, { ...init, credentials: "omit", referrerPolicy: "no-referrer" })
    } catch (error) {
      if ((error as Error | undefined)?.name === "AbortError") throw error
      throw new FileFetchError(0, error instanceof Error ? error.message : undefined)
    }
    if (response.ok) return response
    if ((response.status === 403 || response.status === 401) && attempt === 0) {
      link = await links.renew()
      continue
    }
    throw new FileFetchError(response.status)
  }
}

/** True when the storage understood the range (206) and told how long the file is. */
export function parseContentRange(header: string | null): { start: number; end: number; total: number } | null {
  const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header?.trim() ?? "")
  if (!match) return null
  return { start: Number(match[1]), end: Number(match[2]), total: Number(match[3]) }
}
