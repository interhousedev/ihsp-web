/**
 * The student app's side of the service worker's decisions. The pure functions are shared by every installable app
 * (`@ihsp/features-core/pwa/sw`); what is specific to the student app is here: the cache names it always had, the pages
 * it precaches and the API answers it keeps for offline use (today, timetable, homework, grades).
 */
import {
  classifyRequest as classifyRequestFor,
  createCacheKeys,
  isCacheableApiPath as isCacheableApiPathFor,
  type RequestFacts,
  type RequestKind,
} from "@ihsp/features-core/pwa/sw"

export {
  API_MAX_STALE_MS,
  NETWORK_TIMEOUT_MS,
  OFFLINE_PAGE,
  PRECACHE_FILES,
  STATIC_MAX_ENTRIES,
  SW_CACHE_VERSION,
  answerChanged,
  apiOriginFromSearch,
  entriesToEvict,
  extractAssetUrls,
  isCachedAnswerUsable,
  pageCacheKey,
  portalOriginFromSearch,
  type RequestFacts,
  type RequestKind,
} from "@ihsp/features-core/pwa/sw"

/** API answers the worker keeps for offline use (stale-while-revalidate): today, timetable, homework, grades. */
export const SWR_API_PATHS: readonly string[] = [
  "/v1/me/today",
  "/v1/me/timetable",
  "/v1/me/homework",
  "/v1/me/grades",
  "/v1/me/record-book",
]

/** Pages fetched when the worker installs, so the main screens work offline right after the first visit. */
export const PRECACHE_PAGES: readonly string[] = ["/", "/timetable/", "/homework/", "/grades/"]

const keys = createCacheKeys("sp")

export const shellCacheName = keys.shellCacheName
export const staticCacheName = keys.staticCacheName
export const apiCacheName = keys.apiCacheName
export const cachesToDelete = keys.cachesToDelete
export const apiCaches = keys.apiCaches

/** True when the path is one of `SWR_API_PATHS` or below it (`/v1/me/grades/day`). */
export function isCacheableApiPath(pathname: string): boolean {
  return isCacheableApiPathFor(pathname, SWR_API_PATHS)
}

export function classifyRequest(request: RequestFacts): RequestKind {
  return classifyRequestFor(request, SWR_API_PATHS)
}
