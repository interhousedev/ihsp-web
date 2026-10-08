/** `https://host/ical/x.ics` → `webcal://host/ical/x.ics` (opens the system calendar app). */
export function webcalUrl(url: string): string {
  return url.replace(/^https?:/, "webcal:")
}

/** Google Calendar's "add by URL" link for a feed. */
export function googleCalendarUrl(url: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(url))}`
}
