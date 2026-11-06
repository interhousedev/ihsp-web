export { formatBytes } from "@ihsp/ui"

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
