"use client"

import { isPwaMode } from "../utils/app-mode"
import { PwaRuntimeActive } from "./pwa-runtime-active"

/**
 * Everything the installed app does in the background: the service worker, the session bridge, the offline start and
 * the update check. Mount it inside the query client and auth providers. In the portal it renders nothing.
 */
export function PwaRuntime() {
  return isPwaMode() ? <PwaRuntimeActive /> : null
}
