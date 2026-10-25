/** Seconds per card with one decimal, "2.6"; empty when no card was studied. */
export function secondsPerCard(count: number, seconds: number): string {
  if (count <= 0) return ""
  return (seconds / count).toFixed(1)
}
