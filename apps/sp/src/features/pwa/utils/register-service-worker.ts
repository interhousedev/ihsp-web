/** Where the worker is served from (the sp static export root; the app host's nginx adds `Service-Worker-Allowed`). */
export const SERVICE_WORKER_PATH = "/sw.js"

export type RegisterOptions = {
  /** Origin of the API: the worker only touches requests to it and to its own origin. */
  apiUrl: string
  /** Origin of the portal (`SP_URL`): links of push notifications point there and open in the app instead. */
  portalUrl: string
  /** The browser's `navigator.serviceWorker`; `undefined` where there is none (old browsers, private modes). */
  container: Pick<ServiceWorkerContainer, "register"> | undefined
  /** Registration is a production feature: `next dev` serves unhashed files that a cache-first worker would freeze. */
  production: boolean
}

/** The registration address: the origins travel in the query, so the worker needs no other configuration. */
export function serviceWorkerUrl(apiUrl: string, portalUrl: string): string {
  return `${SERVICE_WORKER_PATH}?api=${encodeURIComponent(apiUrl)}&sp=${encodeURIComponent(portalUrl)}`
}

/** Registers the worker. Never throws: the app works without it, only without offline support. */
export async function registerServiceWorker({
  apiUrl,
  portalUrl,
  container,
  production,
}: RegisterOptions): Promise<ServiceWorkerRegistration | null> {
  if (!production || !container) return null
  try {
    // `updateViaCache: "none"`: the worker file itself is never taken from the HTTP cache when checking for updates.
    return await container.register(serviceWorkerUrl(apiUrl, portalUrl), { scope: "/", updateViaCache: "none" })
  } catch (error) {
    console.warn("[pwa] the service worker could not be registered", error)
    return null
  }
}
