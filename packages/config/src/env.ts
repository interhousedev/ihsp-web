import { z } from "zod"

/** Origins come from `window.__ENV__`; a trailing slash is dropped so `${API_URL}/v1/...` is always valid. */
const url = z.url().transform((value) => value.replace(/\/+$/, ""))

/** Empty strings (an unset variable rendered by `envsubst`) count as missing. */
const optionalText = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined))

export const OAUTH_CLIENT_IDS = ["id", "sp", "staff", "admin", "lms", "share"] as const

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
  STORAGE_ORIGIN: url,
  SENTRY_DSN: optionalText,
})

/** Runtime configuration rendered into `/env.js` at container start (`web/PLAN.md` → Runtime configuration). */
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
  OAUTH_CLIENT_ID: "id" | "sp" | "staff" | "admin" | "lms" | "share"
  STORAGE_ORIGIN: string
  SENTRY_DSN?: string
}
