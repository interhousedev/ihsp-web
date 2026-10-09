"use client"

import { isPwaMode } from "../utils/app-mode"
import { useServiceWorker, type ServiceWorkerOptions } from "../hooks/use-service-worker"
import { UpdateWatcher } from "./update-watcher"

function PwaRuntimeActive(options: ServiceWorkerOptions) {
  useServiceWorker(options)
  return <UpdateWatcher />
}

/**
 * What an installable app does in the background: it registers the service worker (offline pages, the offline fallback)
 * and watches for new builds (an "Update available" toast, or a forced update when the build is too old). Mount it inside the
 * query client and i18n providers. On a plain website (`APP_MODE` is not `pwa`) it renders nothing. The student app has its
 * own runtime on top of this one (session bridge, offline start).
 */
export function PwaRuntime(options: ServiceWorkerOptions = {}) {
  return isPwaMode() ? <PwaRuntimeActive {...options} /> : null
}
