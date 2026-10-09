/**
 * The installable apps and the names of their caches. Shared by the page and the service worker (the worker is a separate
 * bundle), so keep this file free of imports.
 */

/** The apps that can be installed, each on its own host. `sp` is also the apps hub (`app.ihsu.uz`). */
export const PWA_APP_IDS = ["sp", "lms", "library", "staff", "admin"] as const

export type PwaAppId = (typeof PWA_APP_IDS)[number]

export function isPwaAppId(value: unknown): value is PwaAppId {
  return typeof value === "string" && (PWA_APP_IDS as readonly string[]).includes(value)
}

export type CacheNames = {
  /** Every cache of the app starts with this, so the page and the worker can find them. */
  prefix: string
  /** HTML pages and page data. */
  shell: string
  /** Hashed scripts, styles, fonts and icons. */
  static: string
  /** API answers, one cache per signed-in user. */
  api: string
  /** The signed-in user id, kept so a restarted worker still knows whose cache to use. */
  meta: string
}

/**
 * The cache names of one app. The student app keeps the names it always had (`ihsp-shell-v1`); the others put their id in
 * (`ihsp-lms-shell-v1`). Caches belong to an origin, so two apps on two hosts never meet anyway; the ids keep it so
 * when they share one.
 */
export function cacheNames(appId: PwaAppId): CacheNames {
  const prefix = appId === "sp" ? "ihsp-" : `ihsp-${appId}-`
  return {
    prefix,
    shell: `${prefix}shell-`,
    static: `${prefix}static-`,
    api: `${prefix}api-`,
    meta: `${prefix}meta`,
  }
}

/**
 * True when the cache is one of this app. The prefix of `sp` (`ihsp-`) starts every other app's names too, so a name that
 * belongs to a longer prefix of another app is not its own.
 */
export function isOwnCache(appId: PwaAppId, name: string): boolean {
  const { prefix } = cacheNames(appId)
  if (!name.startsWith(prefix)) return false
  return !PWA_APP_IDS.some((other) => {
    if (other === appId) return false
    const otherPrefix = cacheNames(other).prefix
    return otherPrefix.length > prefix.length && name.startsWith(otherPrefix)
  })
}
