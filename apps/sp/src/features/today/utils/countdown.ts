/**
 * Minutes still to go: the server's `minutes_left` minus the minutes that passed since the data was loaded, so the
 * card keeps counting down without refetching (UF-WEB-02).
 */
export function remainingMinutes(minutesLeft: number, loadedAt: number, now: number): number {
  const elapsed = Math.max(0, Math.floor((now - loadedAt) / 60_000))
  return Math.max(0, minutesLeft - elapsed)
}
