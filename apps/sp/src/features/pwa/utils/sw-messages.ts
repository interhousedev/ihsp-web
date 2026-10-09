/**
 * The messages between the page and the service worker, and the names of the caches of the student app. Both live in
 * `@ihsp/features-core/pwa/sw` now (every installable app shares them); the student app's imports keep working.
 */
import { cacheNames } from "@ihsp/features-core/pwa/sw"

export {
  SW_EVENT,
  SW_MESSAGE,
  parseSwEvent,
  parseSwMessage,
  type SwEvent,
  type SwMessage,
} from "@ihsp/features-core/pwa/sw"

const names = cacheNames("sp")

/** Every cache of the app starts with this, so the page and the worker can find them. */
export const CACHE_PREFIX = names.prefix
/** HTML pages and page data. */
export const SHELL_PREFIX = names.shell
/** Hashed scripts, styles, fonts and icons. */
export const STATIC_PREFIX = names.static
/** API answers, one cache per signed-in user. */
export const API_PREFIX = names.api
/** The signed-in user id, kept so a restarted worker still knows whose cache to use. */
export const META_CACHE = names.meta
