"use client"

import { getConfig, type AppEnv } from "@ihsp/config"
import { useT } from "@ihsp/i18n"

export type HubAppKey = "sp" | "lms" | "library" | "admission" | "staff" | "admin"

/** The student app's own icon; the others are copies of their manifest icons under `/icons/apps/` (the hub's CSP allows only same-origin images). */
export const HUB_ICON_PATH = "/icons/icon-192.png"

export type HubApp = {
  key: HubAppKey
  name: string
  description: string
  /** Where the app is installed from (its own host); `null` for the student app, which installs on the hub page itself. */
  href: string | null
  /** The app's own PWA icon (`/icons/icon-192.png` of its manifest), copied into this app's public folder. */
  iconSrc: string
  /** Staff and admin apps are not for students. */
  forStaff: boolean
}

/** The installable apps in display order, with the config key of their address (`sp` is this very page). */
const APPS: readonly {
  key: HubAppKey
  url: keyof AppEnv | null
  forStaff: boolean
}[] = [
  { key: "sp", url: null, forStaff: false },
  { key: "lms", url: "LMS_URL", forStaff: false },
  { key: "library", url: "LIBRARY_URL", forStaff: false },
  { key: "admission", url: "ADMISSION_URL", forStaff: false },
  { key: "staff", url: "STAFF_URL", forStaff: true },
  { key: "admin", url: "ADMIN_URL", forStaff: true },
]

/**
 * The apps the hub (`app.ihsu.uz`) offers to install, with the names and descriptions of the profile menu's platform links
 * and the addresses of the runtime config. An app whose address is not configured is left out.
 */
export function useHubApps(): HubApp[] {
  const t = useT("platforms")
  const config = getConfig()
  return APPS.flatMap(({ key, url, forStaff }) => {
    const href = url ? String(config[url] ?? "") : null
    if (url && !href) return []
    return [
      {
        key,
        name: t(`${key}.name`),
        description: t(`${key}.description`),
        href: href || null,
        iconSrc: key === "sp" ? HUB_ICON_PATH : `/icons/apps/${key}.png`,
        forStaff,
      },
    ]
  })
}
