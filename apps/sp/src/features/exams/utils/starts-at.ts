/**
 * The start of a control as the API wants it: an instant on the control's day in Tashkent time (UTC+5, no daylight
 * saving), from the `HH:mm` of a time field. Null when no time was given.
 */
export function startsAtOf(date: string, time: string): string | null {
  return time === "" ? null : `${date}T${time}:00+05:00`
}
