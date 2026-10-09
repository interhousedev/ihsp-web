/**
 * The registration of the app's service worker, for code that needs `registration.pushManager` (the push helper in
 * `@ihsp/features-core`). `useServiceWorker` registers the worker and hands the pending registration over with
 * `trackServiceWorkerRegistration`; everything else asks with `getServiceWorkerRegistration()`.
 */

let pending: Promise<ServiceWorkerRegistration | null> | null = null

/** Called once by the app when it starts registering the worker. */
export function trackServiceWorkerRegistration(registration: Promise<ServiceWorkerRegistration | null>): void {
  pending = registration
}

/** Forgets the tracked registration (tests). */
export function resetServiceWorkerRegistration(): void {
  pending = null
}

/**
 * The registration of the service worker, or `null` where there is none: the portal (it never registers one), browsers
 * without service workers, `next dev`, or a registration that failed. Waits for a registration that is still in progress.
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (pending) return pending
  const container = typeof navigator === "undefined" ? undefined : navigator.serviceWorker
  if (!container) return null
  try {
    return (await container.getRegistration()) ?? null
  } catch {
    return null
  }
}
