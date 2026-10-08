/** Seconds as whole minutes for the editor fields (`null` stays `null`). */
export function secondsToMinutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.round(seconds / 60)
}

export function minutesToSeconds(minutes: number | null): number | null {
  return minutes === null ? null : Math.round(minutes * 60)
}

const pad = (value: number) => String(value).padStart(2, "0")

/** `m:ss` or `h:mm:ss` for the test timer. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}
