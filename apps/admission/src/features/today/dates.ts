const DAY = 86_400_000
const utc = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Whole days from `from` to `to` (ISO dates). */
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY)

export function shortDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(utc(iso))
}

/** Tone of a deadline by days left: urgent within 14 days, soon within 30. */
export const dayTone = (days: number) =>
  days <= 14 ? "text-destructive" : days <= 30 ? "text-warning" : "text-muted-foreground"

/** The nearest date per (entry, title): "Stanford RD" twice keeps the first one. */
export function dedupeDeadlines<T extends { date: string; list_entry_id: string | null; title: string }>(items: readonly T[]): T[] {
  const best = new Map<string, T>()
  for (const item of items) {
    const key = `${item.list_entry_id ?? ""}|${item.title}`
    const seen = best.get(key)
    if (!seen || item.date < seen.date) best.set(key, item)
  }
  return [...best.values()].toSorted((a, b) => a.date.localeCompare(b.date))
}
