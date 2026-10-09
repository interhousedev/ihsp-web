/**
 * The decisions of the service worker as pure functions: which strategy a request gets, how the caches are named, which
 * ones are old, which assets a page needs. `sw.ts` only wires them to the browser events, so all of it is unit tested.
 */
import { API_PREFIX, CACHE_PREFIX, SHELL_PREFIX, STATIC_PREFIX } from "../utils/sw-messages"

/**
 * Bump to make every installed worker drop all its caches at the next activation (the worker file changes too, which is
 * what makes browsers install it). Page-driven updates (`/v1/app/version`) do not need this.
 */
export const SW_CACHE_VERSION = "v1"

/** API answers the worker keeps for offline use (stale-while-revalidate): today, timetable, homework, grades. */
export const SWR_API_PATHS: readonly string[] = [
  "/v1/me/today",
  "/v1/me/timetable",
  "/v1/me/homework",
  "/v1/me/grades",
  "/v1/me/record-book",
]

/** A cached API answer older than this is not shown any more (the stored query cache of the page has the same limit). */
export const API_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000

/** Pages fetched when the worker installs, so the main screens work offline right after the first visit. */
export const PRECACHE_PAGES: readonly string[] = ["/", "/timetable/", "/homework/", "/grades/"]

/** Small files fetched when the worker installs. `env.js` is the runtime config: without it nothing starts offline. */
export const PRECACHE_FILES: readonly string[] = [
  "/offline.html",
  "/offline.js",
  "/env.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-96.png",
]

/** The page shown when the network is down and the page was never visited. */
export const OFFLINE_PAGE = "/offline.html"

/** How long the network gets before a cached page or `env.js` is used instead. */
export const NETWORK_TIMEOUT_MS = 4000

/** The static cache keeps at most this many files; the oldest go first. */
export const STATIC_MAX_ENTRIES = 400

// - - - Cache names - - -

export function shellCacheName(version: string = SW_CACHE_VERSION): string {
  return `${SHELL_PREFIX}${version}`
}

export function staticCacheName(version: string = SW_CACHE_VERSION): string {
  return `${STATIC_PREFIX}${version}`
}

/** One cache per user and version: a second account on the same phone never sees the first one's answers. */
export function apiCacheName(userId: string, version: string = SW_CACHE_VERSION): string {
  return `${API_PREFIX}${version}-${userId.replace(/[^A-Za-z0-9-]/g, "")}`
}

/**
 * The caches to delete: every cache of the app that is not in `keep`. Caches of other scripts on the origin (they do not
 * start with the app prefix) are never touched.
 */
export function cachesToDelete(existing: readonly string[], keep: readonly string[]): string[] {
  return existing.filter((name) => name.startsWith(CACHE_PREFIX) && !keep.includes(name))
}

/** Names of the API caches, to wipe on logout or when another user signs in. */
export function apiCaches(existing: readonly string[]): string[] {
  return existing.filter((name) => name.startsWith(API_PREFIX))
}

/** How many of the oldest entries to remove so that at most `max` stay. */
export function entriesToEvict(count: number, max: number = STATIC_MAX_ENTRIES): number {
  return Math.max(0, count - max)
}

// - - - Requests - - -

/** What the worker does with a request. */
export type RequestKind =
  /** Hashed assets, icons, manifest: cache first. */
  | "static"
  /** `env.js`: the network, then the cache (so the app starts offline). */
  | "config"
  /** An HTML page: the network, then the cache, then the offline page. */
  | "page"
  /** Page data of client-side navigation (`.txt` files): stale-while-revalidate. */
  | "page-data"
  /** Today, timetable, homework, grades: stale-while-revalidate, per user. */
  | "api-swr"
  /** A change request to the API: passes through, and the cached answers are dropped after it succeeds. */
  | "api-mutation"
  /** Not ours: the browser handles it. */
  | "bypass"

export type RequestFacts = {
  url: string
  method: string
  /** `Request.mode`; `navigate` for page loads. */
  mode: string
  hasRange: boolean
  /** Origin of the worker (the app host). */
  origin: string
  /** Origin of the API, from the registration URL; `null` when unknown. */
  apiOrigin: string | null
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"])
const STATIC_PATHS = ["/_next/static/", "/icons/"]
const STATIC_FILES = new Set(["/manifest.webmanifest", "/offline.js"])
const NEVER_CACHED_FILES = new Set(["/sw.js", "/health"])

/** True when the path is one of `SWR_API_PATHS` or below it (`/v1/me/grades/day`). */
export function isCacheableApiPath(pathname: string): boolean {
  return SWR_API_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`))
}

export function classifyRequest(request: RequestFacts): RequestKind {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()
  if (request.hasRange) return "bypass"

  if (request.apiOrigin && url.origin === request.apiOrigin) {
    if (method === "GET") return isCacheableApiPath(url.pathname) ? "api-swr" : "bypass"
    // Signing in or out and refreshing the token change nothing the cached lists show.
    if (MUTATING.has(method) && url.pathname.startsWith("/v1/") && !url.pathname.startsWith("/v1/oauth/")) {
      return "api-mutation"
    }
    return "bypass"
  }

  if (url.origin !== request.origin || method !== "GET") return "bypass"
  if (NEVER_CACHED_FILES.has(url.pathname)) return "bypass"
  if (url.pathname === "/env.js") return "config"
  if (STATIC_FILES.has(url.pathname) || STATIC_PATHS.some((prefix) => url.pathname.startsWith(prefix))) return "static"
  if (request.mode === "navigate") return "page"
  if (url.pathname.endsWith(".txt") || url.searchParams.has("_rsc")) return "page-data"
  return "bypass"
}

/**
 * The key a page is stored under: the address without query and hash. Entity pages share one HTML file
 * (`/lessons/view/?id=1` and `?id=2`), so one entry serves them all.
 */
export function pageCacheKey(url: string): string {
  const parsed = new URL(url)
  return `${parsed.origin}${parsed.pathname}`
}

/** The API origin the page put in the registration address (`/sw.js?api=https%3A%2F%2Fapi.ihsu.uz`). */
export function apiOriginFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get("api")
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/** The portal origin the page put in the registration address (`&sp=https%3A%2F%2Fsp.ihsu.uz`); push links point there. */
export function portalOriginFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get("sp")
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

// - - - Pages and assets - - -

const ASSET_PATTERN = /\/_next\/static\/[A-Za-z0-9_\-./%~]+?\.(?:js|css|woff2?)/g

/** The hashed scripts, styles and fonts a page needs, as paths (found in `src`/`href` and in the inline page payload). */
export function extractAssetUrls(html: string): string[] {
  return [...new Set(html.match(ASSET_PATTERN) ?? [])]
}

// - - - API answers - - -

/** A cached answer may be shown while it is younger than `API_MAX_STALE_MS` (by its `Date` header; no header: shown). */
export function isCachedAnswerUsable(dateHeader: string | null, now: number): boolean {
  if (!dateHeader) return true
  const at = Date.parse(dateHeader)
  if (Number.isNaN(at)) return true
  return now - at <= API_MAX_STALE_MS
}

/** True when the fresh answer differs from the one the page was given, so the page should ask again. */
export function answerChanged(cachedBody: string, freshBody: string): boolean {
  return cachedBody !== freshBody
}
