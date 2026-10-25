const DAY_MS = 86_400_000

/** Today in Asia/Tashkent as `YYYY-MM-DD`. */
export function tashkentToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now)
}

/** `iso` moved by `days` (negative goes back). */
export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

/** The default range of the statistics: the last 30 days up to today. */
export function defaultRange(now: Date = new Date()): { from: string; to: string } {
  const to = tashkentToday(now)
  return { from: addDays(to, -30), to }
}
