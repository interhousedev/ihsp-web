import { z } from "zod"

/** Origins come from `window.__ENV__`; a trailing slash is dropped so `${API_URL}/v1/...` is always valid. */
const url = z.url().transform((value) => value.replace(/\/+$/, ""))

/** Empty strings (an unset variable rendered by `envsubst`) count as missing. */
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined))

export const OAUTH_CLIENT_IDS = ["id", "sp", "staff", "admin", "lms", "share", "app", "library"] as const

/**
 * What an app runs as. `pwa` turns it into an installable app (manifest, service worker, offline page, forced updates):
 * every app can run so, on its own host. For the SP build `pwa` is the app host (`app.ihsu.uz`): the apps hub, the install
 * page, the longer offline cache and session. Anything else is a plain website: `web` (the neutral name) or `sp` (the
 * name from before the other apps could be installed, still valid). A missing or empty value is `sp`.
 */
export const APP_MODES = ["web", "sp", "pwa"] as const

/** An unset variable rendered by `envsubst` is an empty string: it counts as missing. */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

export const envSchema = z.object({
  APP_ENV: z.enum(["dev", "test", "prod"]),
  API_URL: url,
  ID_URL: url,
  HYDRA_URL: url,
  SP_URL: url,
  STAFF_URL: url,
  ADMIN_URL: url,
  LMS_URL: url,
  SHARE_URL: url,
  SHORT_LINKS_URL: url,
  ROOMS_URL: url,
  MCP_URL: url,
  BOT_USERNAME: z.string().min(1),
  OAUTH_CLIENT_ID: z.enum(OAUTH_CLIENT_IDS),
  APP_MODE: z.preprocess(emptyToUndefined, z.enum(APP_MODES).default("sp")),
  APP_URL: z.preprocess(emptyToUndefined, url.optional()),
  LIBRARY_URL: z.preprocess(emptyToUndefined, url.optional()),
  STORAGE_ORIGIN: url,
  SENTRY_DSN: optionalText,
})

/** Runtime configuration rendered into `/env.js` at container start from the `IHSP_WEB_*` variables; the app reads it from `window.__ENV__`. */
export type AppEnv = {
  APP_ENV: "dev" | "test" | "prod"
  API_URL: string
  ID_URL: string
  HYDRA_URL: string
  SP_URL: string
  STAFF_URL: string
  ADMIN_URL: string
  LMS_URL: string
  SHARE_URL: string
  SHORT_LINKS_URL: string
  ROOMS_URL: string
  MCP_URL: string
  BOT_USERNAME: string
  OAUTH_CLIENT_ID: "id" | "sp" | "staff" | "admin" | "lms" | "share" | "app" | "library"
  /** `pwa` on an installable-app host, `web` (or the older `sp`) everywhere else. */
  APP_MODE: "web" | "sp" | "pwa"
  /** Address of the installable app (`https://app.ihsu.uz`); the portal links to it. Absent when there is none. */
  APP_URL?: string
  /** Address of the library (`https://lib.ihsu.uz`); the profile menus link to it. Absent when there is none. */
  LIBRARY_URL?: string
  STORAGE_ORIGIN: string
  SENTRY_DSN?: string
}
