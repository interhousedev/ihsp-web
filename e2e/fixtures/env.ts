/** Addresses of the stack under test. Defaults are the development servers (`bun run dev`, `scripts/dev.sh all`). */

const env = process.env
const local = env.E2E_STACK === "local"

export type AppKey = "id" | "sp" | "staff" | "admin" | "lms" | "library"

const DEV_PORT: Record<AppKey, number> = { id: 3001, sp: 3002, staff: 3003, admin: 3004, lms: 3005, library: 3008 }

function appUrl(app: AppKey): string {
  const override = env[`E2E_${app.toUpperCase()}_URL`]
  if (override) return override.replace(/\/+$/, "")
  return local ? `http://${app}.localhost` : `http://localhost:${DEV_PORT[app]}`
}

export const URLS = {
  id: appUrl("id"),
  sp: appUrl("sp"),
  staff: appUrl("staff"),
  admin: appUrl("admin"),
  lms: appUrl("lms"),
  library: appUrl("library"),
  /** The share viewer lives under `/ai` (static export `basePath`). */
  share: (env.E2E_SHARE_URL ?? (local ? "http://s.localhost/ai" : "http://localhost:3006/ai")).replace(/\/+$/, ""),
  api: (env.E2E_API_URL ?? (local ? "http://api.localhost" : "http://localhost:8000")).replace(/\/+$/, ""),
  hydra: (env.E2E_HYDRA_URL ?? (local ? "http://id.localhost" : "http://localhost:4444")).replace(/\/+$/, ""),
  /** Room pages are served by the backend: `GET /r/{slug}?pin=`. */
  rooms: (env.E2E_ROOMS_URL ?? (local ? "http://localhost/r" : "http://localhost:8000/r")).replace(/\/+$/, ""),
  mailpit: (env.E2E_MAILPIT_URL ?? (local ? "http://127.0.0.1:8026" : "http://localhost:8025")).replace(/\/+$/, ""),
  /** Object storage (RustFS in the dev compose): the browser `PUT`s presigned uploads here. */
  storage: (env.E2E_STORAGE_URL ?? (local ? "http://localhost:9100" : "http://localhost:9000")).replace(/\/+$/, ""),
  /** Redis of the stack: the fake Telegram sender keeps its outbox there (dev compose publishes 6380). */
  redis: env.E2E_REDIS_URL ?? "redis://localhost:6380/0",
} as const

/** Bot token of the fake Telegram mode (`IHSP_TELEGRAM__BOT_TOKEN`); it signs the mini app `initData`. */
export const BOT_TOKEN = env.E2E_BOT_TOKEN ?? "000:dev"

export function origin(url: string): string {
  return new URL(url).origin
}
