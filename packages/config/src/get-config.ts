import { envSchema, type AppEnv } from "./env"

declare global {
  interface Window {
    /** Set by the blocking `<script src="/env.js">` at the top of every app's `<head>`. */
    __ENV__?: unknown
  }
}

export type ConfigResult = { ok: true; config: AppEnv } | { ok: false; missing: string[]; details: string[] }

let cached: AppEnv | null = null

/** Validates `window.__ENV__`; never throws and never caches (use `getConfig` for the cached value). */
export function readConfig(): ConfigResult {
  const raw: unknown = typeof window === "undefined" ? undefined : window.__ENV__
  if (raw === undefined || raw === null || typeof raw !== "object") {
    return { ok: false, missing: ["window.__ENV__"], details: ["/env.js was not loaded"] }
  }
  const parsed = envSchema.safeParse(raw)
  if (parsed.success) return { ok: true, config: parsed.data as AppEnv }
  const missing = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "window.__ENV__")))]
  const details = parsed.error.issues.map((issue) => `${issue.path.join(".") || "window.__ENV__"}: ${issue.message}`)
  return { ok: false, missing, details }
}

/** Lazy, cached, zod-validated runtime config. Call it from code that runs in the browser, never at module top level. */
export function getConfig(): AppEnv {
  if (cached) return cached
  const result = readConfig()
  if (!result.ok) {
    throw new Error(`Invalid runtime configuration (${result.missing.join(", ")}): ${result.details.join("; ")}`)
  }
  cached = result.config
  return cached
}

/** Drops the cached value; tests change `window.__ENV__` and call this. */
export function resetConfig(): void {
  cached = null
}
