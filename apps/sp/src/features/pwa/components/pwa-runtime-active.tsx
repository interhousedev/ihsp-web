"use client"

import { useOfflineSession } from "../hooks/use-offline-session"
import { useServiceWorker } from "../hooks/use-service-worker"
import { useSessionSync } from "../hooks/use-session-sync"
import { UpdateWatcher } from "./update-watcher"

/** The pwa-mode half of `PwaRuntime`. */
export function PwaRuntimeActive() {
  useServiceWorker()
  useSessionSync()
  useOfflineSession()
  return <UpdateWatcher />
}
