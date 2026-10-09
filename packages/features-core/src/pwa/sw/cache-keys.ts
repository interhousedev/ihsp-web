/**
 * The decisions of the service worker as pure functions: which strategy a request gets, how the caches are named, which
 * ones are old, which assets a page needs. `run-service-worker.ts` only wires them to the browser events, so all of it is
 * unit tested. Nothing here is specific to one app: what differs (the API answers to keep, the cache names) is a parameter.
 */
import { cacheNames, isOwnCache, isPwaAppId, type PwaAppId } from "./cache-names"

/**
 * Bump to make every installed worker drop all its caches at the next activation (the worker file changes too, which is
 * what makes browsers install it). Page-driven updates (`/v1/app/version`) do not need this.
 */
export const SW_CACHE_VERSION = "v1"

/** A cached API answer older than this is not shown any more (the stored query cache of the page has the same limit). */
export const API_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000

/** Small files every app fetches when its worker installs. `env.js` is the runtime config: without it nothing starts offline. */
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

/** The cache names and the cleanup rules of one app. */
export function createCacheKeys(appId: PwaAppId) {
  const names = cacheNames(appId)
  return {
    metaCache: names.meta,
    /** The prefix every cache of the app starts with. */
    cachePrefix: names.prefix,
    /** The prefix of the HTML page caches (the update flow drops them to force fresh pages). */
    shellPrefix: names.shell,
    shellCacheName: (version: string = SW_CACHE_VERSION): string => `${names.shell}${version}`,
    staticCacheName: (version: string = SW_CACHE_VERSION): string => `${names.static}${version}`,
    /** One cache per user and version: a second account on the same phone never sees the first one's answers. */
    apiCacheName: (userId: string, version: string = SW_CACHE_VERSION): string =>
      `${names.api}${version}-${userId.replace(/[^A-Za-z0-9-]/g, "")}`,
    /**
     * The caches to delete: every cache of the app that is not in `keep`. Caches of other scripts on the origin (they do not
     * start with the app prefix) and of other apps are never touched.
     */
    cachesToDelete: (existing: readonly string[], keep: readonly string[]): string[] =>
      existing.filter((name) => isOwnCache(appId, name) && !keep.includes(name)),
    /** Names of the API caches, to wipe on logout or when another user signs in. */
    apiCaches: (existing: readonly string[]): string[] => existing.filter((name) => name.startsWith(names.api)),
  }
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

/** True when the path is one of `swrApiPaths` or below it (`/v1/me/grades/day`). */
export function isCacheableApiPath(pathname: string, swrApiPaths: readonly string[]): boolean {
  return swrApiPaths.some((base) => pathname === base || pathname.startsWith(`${base}/`))
}

/**
 * `swrApiPaths` are the API answers the app keeps for offline use. An app with none (every app but the student one)
 * only gets its pages and files cached; every API request goes straight to the network.
 */
export function classifyRequest(request: RequestFacts, swrApiPaths: readonly string[] = []): RequestKind {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()
  if (request.hasRange) return "bypass"

  if (request.apiOrigin && url.origin === request.apiOrigin) {
    if (method === "GET") return isCacheableApiPath(url.pathname, swrApiPaths) ? "api-swr" : "bypass"
    // Signing in or out and refreshing the token change nothing the cached lists show.
    if (
      swrApiPaths.length > 0 &&
      MUTATING.has(method) &&
      url.pathname.startsWith("/v1/") &&
      !url.pathname.startsWith("/v1/oauth/")
    ) {
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

function originFromSearch(search: string, name: string): string | null {
  const value = new URLSearchParams(search).get(name)
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/** The API origin the page put in the registration address (`/sw.js?api=https%3A%2F%2Fapi.ihsu.uz`). */
export function apiOriginFromSearch(search: string): string | null {
  return originFromSearch(search, "api")
}

/** The portal origin the page put in the registration address (`&sp=https%3A%2F%2Fsp.ihsu.uz`); push links point there. */
export function portalOriginFromSearch(search: string): string | null {
  return originFromSearch(search, "sp")
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

/** The app id the page put in the registration address (`&app=lms`); the student app leaves it out. */
export function appIdFromSearch(search: string): PwaAppId {
  const value = new URLSearchParams(search).get("app")
  return isPwaAppId(value) ? value : "sp"
}
