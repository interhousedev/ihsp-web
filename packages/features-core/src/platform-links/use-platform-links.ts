"use client"

import { useAuthStore } from "@ihsp/auth"
import { getConfig, type AppEnv } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import type { PlatformLink } from "@ihsp/ui"
import { platformKeysFor, type PlatformKey } from "./platform-keys"

const URL_KEYS: Record<PlatformKey, keyof AppEnv> = {
  sp: "SP_URL",
  staff: "STAFF_URL",
  admin: "ADMIN_URL",
  lms: "LMS_URL",
  library: "LIBRARY_URL",
  id: "ID_URL",
}

/**
 * The IHSP platforms the logged-in user can open, for `UserMenu`'s `platforms` prop: SP / Staff / Admin / LMS / ID by
 * role, addresses from the runtime config, the app the user is in marked as current. Empty while logged out. It reads
 * the auth store directly, so a page without `AuthProvider` (the public share viewer) never starts a login by asking.
 */
export function usePlatformLinks(): PlatformLink[] {
  const t = useT("platforms")
  const roles = useAuthStore((state) => state.user?.roles)
  if (!roles) return []

  const config = getConfig()
  // An optional address (`LIBRARY_URL`) that is not configured hides its entry.
  return platformKeysFor(roles)
    .filter((key) => config[URL_KEYS[key]])
    .map((key) => ({
      key,
      name: t(`${key}.name`),
      description: t(`${key}.description`),
      href: String(config[URL_KEYS[key]]),
      // The installable app (client `app`) is the student portal in another host.
      current: (config.OAUTH_CLIENT_ID === "app" ? "sp" : config.OAUTH_CLIENT_ID) === key,
    }))
}
