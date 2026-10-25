import type { PwaAppId } from "../sw/cache-names"

/** Where the worker is served from (the root of the app's static export). */
export const SERVICE_WORKER_PATH = "/sw.js"

export type RegisterOptions = {
  /** Origin of the API: the worker only touches requests to it and to its own origin. */
  apiUrl: string
  /** Origin of the portal (`SP_URL`): links of push notifications point there and open in the app instead. */
  portalUrl: string
  /** Which app registers; named in the address so the worker names its caches after it. Left out for the student app. */
  appId?: PwaAppId
  /** The browser's `navigator.serviceWorker`; `undefined` where there is none (old browsers, private modes). */
  container: Pick<ServiceWorkerContainer, "register"> | undefined
  /** Registration is a production feature: `next dev` serves unhashed files that a cache-first worker would freeze. */
  production: boolean
}

/**
 * The registration address: the origins travel in the query, so the worker needs no other configuration. Every app but the
 * student one adds `&app=<id>`, which the generic worker names its caches after.
 */
export function serviceWorkerUrl(apiUrl: string, portalUrl: string, appId?: PwaAppId): string {
  const app = appId && appId !== "sp" ? `&app=${appId}` : ""
  return `${SERVICE_WORKER_PATH}?api=${encodeURIComponent(apiUrl)}&sp=${encodeURIComponent(portalUrl)}${app}`
}

/** Registers the worker. Never throws: the app works without it, only without offline support. */
export async function registerServiceWorker({
  apiUrl,
  portalUrl,
  appId,
  container,
  production,
}: RegisterOptions): Promise<ServiceWorkerRegistration | null> {
  if (!production || !container) return null
  try {
    // `updateViaCache: "none"`: the worker file itself is never taken from the HTTP cache when checking for updates.
    return await container.register(serviceWorkerUrl(apiUrl, portalUrl, appId), { scope: "/", updateViaCache: "none" })
  } catch (error) {
    console.warn("[pwa] the service worker could not be registered", error)
    return null
  }
}
