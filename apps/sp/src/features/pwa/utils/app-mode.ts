import { getConfig } from "@ihsp/config"

/**
 * True on the installable-app host (`app.ihsu.uz`): the same static build as the portal, started with `APP_MODE=pwa`
 * in `/env.js`. On `sp.ihsu.uz` and in the Telegram mini app it is false, and nothing of this feature is active.
 * False as well when the runtime config is not there (prerendering, a broken deployment).
 */
export function isPwaMode(): boolean {
  try {
    return getConfig().APP_MODE === "pwa"
  } catch {
    return false
  }
}

/** The address of the installable app, or `null` when the deployment has none (the portal then shows no install entry). */
export function installAppUrl(): string | null {
  try {
    return getConfig().APP_URL ?? null
  } catch {
    return null
  }
}
