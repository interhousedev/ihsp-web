const UNITS = ["B", "KB", "MB", "GB"] as const

/** `1536` → `1.5 KB`; always one decimal above 1 KB, units are the same in every language. */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return unit === 0 ? `${Math.round(value)} ${UNITS[0]}` : `${value.toFixed(1)} ${UNITS[unit]}`
}
