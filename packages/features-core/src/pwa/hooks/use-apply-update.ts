"use client"

import { useCallback } from "react"
import { cacheNames } from "../sw/cache-names"
import { applyUpdate } from "../utils/apply-update"
import { pwaAppId } from "../utils/app-id"

export type ApplyUpdateOptions = {
  /** Forget what depends on the old build (the stored query cache of the student app); nothing by default. */
  clearStored?: () => void
}

/** `applyUpdate` wired to the browser: the real service worker container, caches and `location.reload`. */
export function useApplyUpdate({ clearStored }: ApplyUpdateOptions = {}): () => Promise<void> {
  return useCallback(
    () =>
      applyUpdate({
        reload: () => window.location.reload(),
        container: navigator.serviceWorker,
        cacheStorage: typeof caches === "undefined" ? undefined : caches,
        clearStored: clearStored ?? (() => undefined),
        shellPrefix: cacheNames(pwaAppId() ?? "sp").shell,
      }),
    [clearStored],
  )
}
