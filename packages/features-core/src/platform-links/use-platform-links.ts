"use client"

import { useAuthStore } from "@ihsp/auth"
import { getConfig, type AppEnv } from "@ihsp/config"
import { useT } from "@ihsp/i18n"
import type { PlatformLink } from "@ihsp/ui"
import { installAppUrl, isPwaMode } from "../pwa/utils/app-mode"
import { platformKeysFor, type PlatformKey } from "./platform-keys"

const URL_KEYS: Record<PlatformKey, keyof AppEnv> = {
  sp: "SP_URL",
  staff: "STAFF_URL",
  admin: "ADMIN_URL",
  lms: "LMS_URL",
  library: "LIBRARY_URL",
  id: "ID_URL",
}

/** Apps that are installed separately: in the installed app their links go to the apps hub, to the app's install steps. */
const HUB_ANCHORS: readonly PlatformKey[] = ["lms", "library", "staff", "admin"]

/** `https://app.ihsu.uz` + `lms` → `https://app.ihsu.uz/#install-lms`. */
export function installAnchorUrl(hub: string, key: PlatformKey): string {
  return `${hub.replace(/\/+$/, "")}/#install-${key}`
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
  const hub = isPwaMode() ? installAppUrl() : null
  // An optional address (`LIBRARY_URL`) that is not configured hides its entry.
  return platformKeysFor(roles)
    .filter((key) => config[URL_KEYS[key]])
    .map((key) => ({
      key,
      name: t(`${key}.name`),
      description: t(`${key}.description`),
      href: hub && HUB_ANCHORS.includes(key) ? installAnchorUrl(hub, key) : String(config[URL_KEYS[key]]),
      // The installable app (client `app`) is the student portal in another host.
      current: (config.OAUTH_CLIENT_ID === "app" ? "sp" : config.OAUTH_CLIENT_ID) === key,
    }))
}
