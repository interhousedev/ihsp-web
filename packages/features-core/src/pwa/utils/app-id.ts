import { getConfig } from "@ihsp/config"
import { isPwaAppId, type PwaAppId } from "../sw/cache-names"

/**
 * Which installable app this page is, from its OAuth client: the student app runs as `sp` on the portal and as `app` on
 * the app host, the others under their own name. `null` for the apps that cannot be installed (`id`, `share`) and when the
 * runtime config is not there (prerendering, a broken deployment). The worker names its caches with the same id.
 */
export function pwaAppId(): PwaAppId | null {
  try {
    const client = getConfig().OAUTH_CLIENT_ID
    const id = client === "app" ? "sp" : client
    return isPwaAppId(id) ? id : null
  } catch {
    return null
  }
}
