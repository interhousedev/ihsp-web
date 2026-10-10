/** Bytes as `12.4 MB`; storage sizes are far below a petabyte. */
export function formatBytes(value: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = value
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`
}

/** Tokens as `12k` or `1.2M`. */
export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`
  return String(value)
}

/** 0.974 -> `97%`; null stays null. */
export function percent(rate: number | null): number | null {
  return rate === null ? null : Math.round(rate * 100)
}

/** The share of `part` in `whole`, 0 to 100 (0 for an empty whole). */
export function share(part: number, whole: number): number {
  return whole <= 0 ? 0 : Math.round((part / whole) * 100)
}
