"use client"

import { useCallback } from "react"
import { clearPersistedQueries } from "../../offline/utils/persisted-queries"
import { applyUpdate } from "../utils/apply-update"

/** `applyUpdate` wired to the browser: the real service worker container, caches and `location.reload`. */
export function useApplyUpdate(): () => Promise<void> {
  return useCallback(
    () =>
      applyUpdate({
        reload: () => window.location.reload(),
        container: navigator.serviceWorker,
        cacheStorage: typeof caches === "undefined" ? undefined : caches,
        clearStored: clearPersistedQueries,
      }),
    [],
  )
}
