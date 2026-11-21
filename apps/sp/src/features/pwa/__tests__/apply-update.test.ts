/** Applying an update: stale pages and stored answers go, a waiting worker takes over, then the page reloads. */
import { describe, expect, mock, test } from "bun:test"
import { applyUpdate, purgeShellCaches, type UpdateDeps } from "../utils/apply-update"
import { SW_MESSAGE } from "../utils/sw-messages"

function fakeCacheStorage(names: string[]) {
  const deleted: string[] = []
  const storage = {
    keys: async () => names,
    delete: async (name: string) => {
      deleted.push(name)
      return true
    },
  } as unknown as CacheStorage
  return { storage, deleted }
}

describe("purgeShellCaches", () => {
  test("deletes the cached pages and keeps assets, answers and other scripts' caches", async () => {
    const { storage, deleted } = fakeCacheStorage(["ihsp-shell-v2", "ihsp-static-v2", "ihsp-api-v2-u1", "workbox-x"])

    await purgeShellCaches(storage)

    expect(deleted).toEqual(["ihsp-shell-v2"])
  })

  test("is fine without the Cache API", async () => {
    await purgeShellCaches(undefined)
  })
})

function setup(registration: Partial<ServiceWorkerRegistration> | undefined) {
  const listeners: (() => void)[] = []
  const container = {
    getRegistration: async () => registration,
    addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
  } as unknown as ServiceWorkerContainer
  const { storage, deleted } = fakeCacheStorage(["ihsp-shell-v2"])
  const calls: string[] = []
  const deps: UpdateDeps = {
    reload: () => calls.push("reload"),
    container,
    cacheStorage: storage,
    clearStored: () => calls.push("clearStored"),
  }
  return { deps, calls, deleted, listeners }
}

describe("applyUpdate", () => {
  test("without a worker it clears, purges and reloads", async () => {
    const { deps, calls, deleted } = setup(undefined)

    await applyUpdate(deps)

    expect(calls).toEqual(["clearStored", "reload"])
    expect(deleted).toEqual(["ihsp-shell-v2"])
  })

  test("a waiting worker is told to take over, and the page reloads once it has", async () => {
    const postMessage = mock(() => undefined)
    const update = mock(async () => ({}) as ServiceWorkerRegistration)
    const { deps, calls, listeners } = setup({ update, waiting: { postMessage } as unknown as ServiceWorker })

    const done = applyUpdate(deps)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(postMessage).toHaveBeenCalledWith({ type: SW_MESSAGE.skipWaiting })
    expect(calls).not.toContain("reload")
    for (const listener of listeners) listener()
    await done

    expect(update).toHaveBeenCalled()
    expect(calls).toEqual(["clearStored", "reload"])
  })

  test("a failing update check (offline) still reloads", async () => {
    const { deps, calls } = setup({
      update: async () => {
        throw new TypeError("network")
      },
    })

    await applyUpdate(deps)

    expect(calls).toEqual(["clearStored", "reload"])
  })
})
