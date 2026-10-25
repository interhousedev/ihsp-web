// The service worker side of the installable apps: no React, no DOM, so a worker bundle can import it.
export { PWA_APP_IDS, cacheNames, isOwnCache, isPwaAppId, type CacheNames, type PwaAppId } from "./cache-names"
export {
  API_MAX_STALE_MS,
  NETWORK_TIMEOUT_MS,
  OFFLINE_PAGE,
  PRECACHE_FILES,
  STATIC_MAX_ENTRIES,
  SW_CACHE_VERSION,
  answerChanged,
  apiOriginFromSearch,
  appIdFromSearch,
  classifyRequest,
  createCacheKeys,
  entriesToEvict,
  extractAssetUrls,
  isCacheableApiPath,
  isCachedAnswerUsable,
  pageCacheKey,
  portalOriginFromSearch,
  type RequestFacts,
  type RequestKind,
} from "./cache-keys"
export {
  DEFAULT_TITLE,
  NOTIFICATION_BADGE,
  NOTIFICATION_ICON,
  clickTarget,
  notificationOptions,
  parsePushPayload,
  showPush,
  type ClickTarget,
  type PushPayload,
} from "./push"
export { runServiceWorker, type SwProfile } from "./run-service-worker"
export { SW_EVENT, SW_MESSAGE, parseSwEvent, parseSwMessage, type SwEvent, type SwMessage } from "./sw-messages"
