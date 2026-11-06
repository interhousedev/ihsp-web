export { formatBytes } from "@ihsp/ui"

/** Share of the quota in use, 0 to 100. */
export function quotaPercent(used: number, quota: number): number {
  if (quota <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((used / quota) * 100)))
}

/** PDFs and images open in the browser; everything else is downloaded (FILE-3). */
export function opensInline(contentType: string): boolean {
  return contentType === "application/pdf" || contentType.startsWith("image/")
}
