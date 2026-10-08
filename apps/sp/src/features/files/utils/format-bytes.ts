const UNITS = ["KB", "MB", "GB", "TB"] as const

/** `640 MB`, `1.5 GB`: binary units with at most one decimal. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const rounded = Math.round(value * 10) / 10
  const text = rounded >= 100 || Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1)
  return `${text} ${UNITS[unit]}`
}

/** Share of the quota in use, 0 to 100. */
export function quotaPercent(used: number, quota: number): number {
  if (quota <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((used / quota) * 100)))
}

/** PDFs and images open in the browser; everything else is downloaded (FILE-3). */
export function opensInline(contentType: string): boolean {
  return contentType === "application/pdf" || contentType.startsWith("image/")
}
