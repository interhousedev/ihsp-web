/**
 * The build version of this bundle, compared with `GET /v1/app/version`. Set at build time
 * (`NEXT_PUBLIC_APP_VERSION=1.4.0 bun run build`); the release process raises it, the backend settings
 * `APP__LATEST` / `APP__MIN_SUPPORTED` say which builds are current and which must update.
 */
export const APP_VERSION: string = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"

/** What `GET /v1/app/version` answers. */
export type AppVersionInfo = { latest: string; min_supported: string }

/** What the app does about a version answer. */
export type UpdateDecision = "none" | "available" | "force"

const VERSION_PATTERN = /^\d+(?:\.\d+){0,3}$/

/** `"1.4.2"` → `[1, 4, 2]`; `null` for anything that is not dotted numbers (such a value is never acted upon). */
export function parseVersion(value: string): number[] | null {
  const text = value.trim()
  if (!VERSION_PATTERN.test(text)) return null
  return text.split(".").map(Number)
}

/** -1, 0 or 1; missing segments count as 0, so `1.4` equals `1.4.0` and `1.10` is newer than `1.9`. */
export function compareVersions(a: readonly number[], b: readonly number[]): -1 | 0 | 1 {
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0
    const right = b[index] ?? 0
    if (left !== right) return left < right ? -1 : 1
  }
  return 0
}

/**
 * `force` when this build is older than the oldest supported one (update now, no questions), `available` when a newer
 * build exists (offer it), `none` otherwise. Values that cannot be parsed never force anything.
 */
export function decideUpdate(current: string, info: AppVersionInfo): UpdateDecision {
  const mine = parseVersion(current)
  if (!mine) return "none"
  const minimum = parseVersion(info.min_supported)
  if (minimum && compareVersions(mine, minimum) < 0) return "force"
  const latest = parseVersion(info.latest)
  if (latest && compareVersions(mine, latest) < 0) return "available"
  return "none"
}
