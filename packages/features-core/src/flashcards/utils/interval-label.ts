/**
 * The label above a rating button, as Anki shows it: a step shorter than an hour is "<1m" or "<10m" (the card comes
 * back within the session), longer intervals are exact ("1d", "4d", "2mo").
 */
export function intervalLabel(raw: string): string {
  return /^\d+m$/.test(raw) ? `<${raw}` : raw
}
