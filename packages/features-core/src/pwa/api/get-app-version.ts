import { api } from "@ihsp/api"
import type { AppVersionInfo } from "../utils/app-version"

/**
 * GET /v1/app/version — public. The newest build and the oldest build that may still run. Never cached by the browser
 * or the service worker: the answer is how the backend forces an update.
 */
export function getAppVersion(signal?: AbortSignal): Promise<AppVersionInfo> {
  return api.get<AppVersionInfo>("/v1/app/version", { auth: "none", cache: "no-store", signal })
}
