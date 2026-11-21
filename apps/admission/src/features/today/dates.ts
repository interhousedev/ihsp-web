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
