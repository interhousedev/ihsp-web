import { cacheNames } from "../sw/cache-names"
import { SW_MESSAGE } from "../sw/sw-messages"

/** How long to wait for a new worker to install before reloading anyway. */
export const INSTALL_WAIT_MS = 5000

export type UpdateDeps = {
  reload: () => void
  container: ServiceWorkerContainer | undefined
  cacheStorage: CacheStorage | undefined
  /** Forget what depends on the old build (the stored query cache). */
  clearStored: () => void
  /** Prefix of the app's HTML page caches (`createCacheKeys(appId).shellPrefix`); the student app's when left out. */
  shellPrefix?: string
}

/** Deletes the cached HTML pages, so the next load of any page comes from the network. */
export async function purgeShellCaches(
  storage: CacheStorage | undefined,
  shellPrefix: string = cacheNames("sp").shell,
): Promise<void> {
  if (!storage) return
  const names = (await storage.keys()).filter((name) => name.startsWith(shellPrefix))
  await Promise.all(names.map((name) => storage.delete(name)))
}

/** Resolves with the worker that is ready to take over, or `null` when there is none (yet). */
export function waitForWaitingWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs: number = INSTALL_WAIT_MS,
): Promise<ServiceWorker | null> {
  if (registration.waiting) return Promise.resolve(registration.waiting)
  const installing = registration.installing
  if (!installing) return Promise.resolve(null)
  return new Promise((resolve) => {
    const finish = () => resolve(registration.waiting ?? null)
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed" || installing.state === "redundant") finish()
    })
    setTimeout(finish, timeoutMs)
  })
}

/**
 * Brings the page to the newest build: drops the cached pages and stored answers, looks for a newer worker, lets it
 * take over, then reloads. Used by the "Reload" button of the update toast and, without asking, by a forced update
 * (this build is older than `min_supported`). Every step is allowed to fail (offline): the reload happens in any case.
 */
export async function applyUpdate(deps: UpdateDeps): Promise<void> {
  deps.clearStored()
  await purgeShellCaches(deps.cacheStorage, deps.shellPrefix).catch(() => undefined)

  const registration = await deps.container?.getRegistration().catch(() => undefined)
  if (registration && deps.container) {
    await registration.update().catch(() => undefined)
    const waiting = await waitForWaitingWorker(registration)
    if (waiting) {
      const taken = new Promise<void>((resolve) => {
        deps.container?.addEventListener("controllerchange", () => resolve(), { once: true })
        setTimeout(resolve, INSTALL_WAIT_MS)
      })
      // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a ServiceWorker, not a window
      waiting.postMessage({ type: SW_MESSAGE.skipWaiting })
      await taken
    }
  }
  deps.reload()
}
