/**
 * The service worker of the installable app (`app.ihsu.uz`). `bun run build:sw` bundles it to `public/sw.js`; the page
 * registers it only in pwa mode. All decisions live in `cache-keys.ts`; this file wires them to the browser events.
 *
 * - hashed assets, icons, manifest: cache first (they never change under the same name);
 * - HTML pages and `env.js`: the network first, the cache when it does not answer in 4 s or is down, an offline page
 *   when the page was never visited (a cached page is never newer than the server's chunks, so nothing mismatches);
 * - today, timetable, homework, grades: stale-while-revalidate per user, with a message to the page when the fresh
 *   answer differs; any successful change request drops the cached answers;
 * - push: a `push` event shows a notification, a tap focuses the app and opens the link;
 * - nothing else is touched (sign-in, token refresh, files, the AI chat).
 * Updates are driven by the page: it asks `GET /v1/app/version`, and tells a waiting worker to take over.
 */
import { META_CACHE, SW_EVENT, SW_MESSAGE, parseSwMessage } from "../utils/sw-messages"
import {
  NETWORK_TIMEOUT_MS,
  OFFLINE_PAGE,
  PRECACHE_FILES,
  PRECACHE_PAGES,
  STATIC_MAX_ENTRIES,
  answerChanged,
  apiCacheName,
  apiCaches,
  apiOriginFromSearch,
  cachesToDelete,
  classifyRequest,
  entriesToEvict,
  extractAssetUrls,
  isCachedAnswerUsable,
  pageCacheKey,
  portalOriginFromSearch,
  shellCacheName,
  staticCacheName,
} from "./cache-keys"
import { clickTarget, notificationOptions, parsePushPayload } from "./push"

type SwExtendableEvent = Event & { waitUntil(promise: Promise<unknown>): void }
type SwFetchEvent = SwExtendableEvent & {
  readonly request: Request
  respondWith(response: Response | Promise<Response>): void
}
type SwMessageEvent = SwExtendableEvent & { readonly data: unknown }
type SwPushEvent = SwExtendableEvent & { readonly data: { text(): string } | null }
type SwNotificationClickEvent = SwExtendableEvent & {
  readonly notification: { close(): void; readonly data: unknown }
}
type SwWindowClient = {
  readonly url: string
  postMessage(message: unknown): void
  focus(): Promise<unknown>
  navigate(url: string): Promise<unknown>
}
type SwScope = {
  readonly location: Location
  readonly registration: { showNotification(title: string, options: object): Promise<void> }
  readonly clients: {
    claim(): Promise<void>
    matchAll(options: { type: "window"; includeUncontrolled: boolean }): Promise<readonly SwWindowClient[]>
    openWindow(url: string): Promise<unknown>
  }
  skipWaiting(): Promise<void>
  addEventListener(type: "install" | "activate", listener: (event: SwExtendableEvent) => void): void
  addEventListener(type: "fetch", listener: (event: SwFetchEvent) => void): void
  addEventListener(type: "message", listener: (event: SwMessageEvent) => void): void
  addEventListener(type: "push", listener: (event: SwPushEvent) => void): void
  addEventListener(type: "notificationclick", listener: (event: SwNotificationClickEvent) => void): void
}

// Module scope, so this shadows the DOM `self` type for this file only.
declare const self: SwScope

const OWN_ORIGIN = self.location.origin
const API_ORIGIN = apiOriginFromSearch(self.location.search)
const PORTAL_ORIGIN = portalOriginFromSearch(self.location.search)
const USER_KEY = "/__user"
/** Page data (`.txt` files of client-side navigation) is kept in the shell cache; this many files at most. */
const SHELL_MAX_ENTRIES = 200

// - - - Helpers - - -

async function trim(cache: Cache, max: number): Promise<void> {
  const keys = await cache.keys()
  const extra = entriesToEvict(keys.length, max)
  await Promise.all(keys.slice(0, extra).map((key) => cache.delete(key)))
}

/** The network answer, or `null` when it fails or takes longer than the timeout (the request itself carries on). */
function withTimeout(network: Promise<Response>, ms: number): Promise<Response | null> {
  const failed = network.catch(() => null)
  const timer = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  return Promise.race([failed, timer])
}

async function currentUser(): Promise<string | null> {
  const cache = await caches.open(META_CACHE)
  const hit = await cache.match(USER_KEY)
  const userId = hit ? await hit.text() : ""
  return userId || null
}

async function setUser(userId: string): Promise<void> {
  const cache = await caches.open(META_CACHE)
  await cache.put(USER_KEY, new Response(userId))
  const keep = apiCacheName(userId)
  await Promise.all(
    apiCaches(await caches.keys())
      .filter((name) => name !== keep)
      .map((name) => caches.delete(name)),
  )
}

async function wipeApiCaches(): Promise<void> {
  await Promise.all(apiCaches(await caches.keys()).map((name) => caches.delete(name)))
}

async function clearUser(): Promise<void> {
  await Promise.all([wipeApiCaches(), caches.delete(META_CACHE)])
}

async function purgeShell(): Promise<void> {
  await caches.delete(shellCacheName())
}

async function notifyClients(url: string): Promise<void> {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a Client of the worker, not a window
  for (const client of clients) client.postMessage({ type: SW_EVENT.apiUpdated, url })
}

// - - - Install and activate - - -

async function fetchInto(cache: Cache, path: string): Promise<Response | null> {
  try {
    const response = await fetch(path, { cache: "reload" })
    if (!response.ok) return null
    await cache.put(new URL(path, OWN_ORIGIN).href, response.clone())
    return response
  } catch {
    return null
  }
}

/** Files the cache-first strategy serves go to the static cache, the rest (`env.js`, the offline page) to the shell cache. */
function isStatic(path: string): boolean {
  const facts = {
    url: new URL(path, OWN_ORIGIN).href,
    method: "GET",
    mode: "cors",
    hasRange: false,
    origin: OWN_ORIGIN,
    apiOrigin: API_ORIGIN,
  }
  return classifyRequest(facts) === "static"
}

async function precache(): Promise<void> {
  const shell = await caches.open(shellCacheName())
  const assets = await caches.open(staticCacheName())
  const files = PRECACHE_FILES.map((path) => fetchInto(isStatic(path) ? assets : shell, path))
  // The pages first: the scripts and styles they use are found in them, and each is fetched once however many pages use it.
  const pages = await Promise.all(
    PRECACHE_PAGES.map(async (path) => {
      const response = await fetchInto(shell, path)
      return response ? extractAssetUrls(await response.text()) : []
    }),
  )
  const urls = [...new Set(pages.flat())]
  const found = urls.map(async (url) => {
    if (await assets.match(new URL(url, OWN_ORIGIN).href)) return
    await fetchInto(assets, url)
  })
  await Promise.allSettled([...files, ...found])
}

async function cleanup(): Promise<void> {
  const userId = await currentUser()
  const keep = [shellCacheName(), staticCacheName(), META_CACHE, ...(userId ? [apiCacheName(userId)] : [])]
  await Promise.all(cachesToDelete(await caches.keys(), keep).map((name) => caches.delete(name)))
  await self.clients.claim()
}

self.addEventListener("install", (event) => {
  // No skipWaiting here: a new worker waits until the page says so (an update toast, or a forced update).
  event.waitUntil(precache())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanup())
})

// - - - Strategies - - -

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(staticCacheName())
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    await trim(cache, STATIC_MAX_ENTRIES)
  }
  return response
}

/** Network first with the cache as fallback, for HTML pages (`key` without the query) and `env.js`. */
async function networkFirst(event: SwFetchEvent, key: string, fallbackToOfflinePage: boolean): Promise<Response> {
  const { request } = event
  const cache = await caches.open(shellCacheName())
  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(key, response.clone())
    return response
  })
  event.waitUntil(network.catch(() => undefined))
  const fresh = await withTimeout(network, NETWORK_TIMEOUT_MS)
  if (fresh) return fresh
  const stored = await cache.match(key)
  if (stored) return stored
  if (fallbackToOfflinePage) {
    const offline = await cache.match(new URL(OFFLINE_PAGE, OWN_ORIGIN).href)
    if (offline) return offline
  }
  return Response.error()
}

async function staleWhileRevalidate(event: SwFetchEvent): Promise<Response> {
  const { request } = event
  const cache = await caches.open(shellCacheName())
  const cached = await cache.match(request)
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone())
      await trim(cache, SHELL_MAX_ENTRIES)
    }
    return response
  })
  if (cached) {
    event.waitUntil(refresh.catch(() => undefined))
    return cached
  }
  return refresh
}

async function revalidateApi(request: Request, cache: Cache, stale: Response | null): Promise<Response> {
  const response = await fetch(request)
  if (!response.ok) return response
  const before = stale ? await stale.text() : null
  const after = await response.clone().text()
  await cache.put(request, response.clone())
  if (before !== null && answerChanged(before, after)) await notifyClients(request.url)
  return response
}

async function apiResponse(event: SwFetchEvent): Promise<Response> {
  const { request } = event
  const userId = await currentUser()
  // Nobody is signed in as far as the worker knows: nothing may be stored or shown from the cache.
  if (!userId) return fetch(request)
  const cache = await caches.open(apiCacheName(userId))
  const cached = await cache.match(request, { ignoreVary: true })
  const usable = cached && isCachedAnswerUsable(cached.headers.get("date"), Date.now()) ? cached : null
  if (!usable) return revalidateApi(request, cache, null)
  event.waitUntil(revalidateApi(request, cache, usable.clone()).catch(() => undefined))
  return usable
}

async function mutation(event: SwFetchEvent): Promise<Response> {
  const response = await fetch(event.request)
  if (response.ok) event.waitUntil(wipeApiCaches())
  return response
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const kind = classifyRequest({
    url: request.url,
    method: request.method,
    mode: request.mode,
    hasRange: request.headers.has("range"),
    origin: OWN_ORIGIN,
    apiOrigin: API_ORIGIN,
  })
  switch (kind) {
    case "static":
      event.respondWith(cacheFirst(request))
      return
    case "config":
      event.respondWith(networkFirst(event, pageCacheKey(request.url), false))
      return
    case "page":
      event.respondWith(networkFirst(event, pageCacheKey(request.url), true))
      return
    case "page-data":
      event.respondWith(staleWhileRevalidate(event))
      return
    case "api-swr":
      event.respondWith(apiResponse(event))
      return
    case "api-mutation":
      event.respondWith(mutation(event))
      return
    default:
  }
})

// - - - Messages from the page - - -

self.addEventListener("message", (event) => {
  const message = parseSwMessage(event.data)
  if (!message) return
  switch (message.type) {
    case SW_MESSAGE.setUser:
      event.waitUntil(setUser(message.userId))
      return
    case SW_MESSAGE.clearUser:
      event.waitUntil(clearUser())
      return
    case SW_MESSAGE.purgeShell:
      event.waitUntil(purgeShell())
      return
    case SW_MESSAGE.skipWaiting:
      event.waitUntil(self.skipWaiting())
      return
  }
})

// - - - Push notifications - - -

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event.data ? event.data.text() : null)
  // Browsers (iOS especially) require every push to show a notification.
  event.waitUntil(self.registration.showNotification(payload.title, notificationOptions(payload)))
})

async function openLink(url: string): Promise<void> {
  const target = clickTarget(url, OWN_ORIGIN, PORTAL_ORIGIN)
  if (target.kind === "external") {
    await self.clients.openWindow(target.url)
    return
  }
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  const open = windows.find((client) => new URL(client.url).origin === OWN_ORIGIN)
  if (open) {
    try {
      await open.focus()
      await open.navigate(target.url)
      return
    } catch {
      // A window that cannot be navigated (not controlled yet): open a new one.
    }
  }
  await self.clients.openWindow(target.url)
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data = event.notification.data as { url?: unknown } | null
  event.waitUntil(openLink(typeof data?.url === "string" ? data.url : "/"))
})
