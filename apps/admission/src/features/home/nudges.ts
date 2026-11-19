import type { CalendarEntry } from "../deadlines/calendar-api"
import type { ListEntry } from "../chooser/types"

const DAY_MS = 86_400_000

export type Nudge = {
  kind: "last-chance" | "add-result"
  entry: ListEntry
  /** Days until the deadline (0 = today); only for `last-chance`. */
  days: number
  day: string
  tier: "month" | "week" | "today"
  cycleYear: number
}

const PLANNED = new Set(["considering", "applying"])
const APPLIED = new Set(["applying", "applied"])

function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS)
}

function entryIdOf(item: CalendarEntry): string | null {
  const parts = item.key.split(":")
  return item.source === "university" && parts[0] === "uni" ? (parts[1] ?? null) : null
}

/**
 * Nudges for the dashboard: planned applications whose nearest deadline is 30, 7 or 0 days away (the closest tier
 * wins), and applied universities whose deadline has passed without a reported result.
 */
export function buildNudges(
  entries: readonly ListEntry[],
  calendar: readonly CalendarEntry[],
  reportedInstitutionIds: ReadonlySet<string>,
  today: string,
): Nudge[] {
  const todayNumber = dayNumber(today)
  const byEntry = new Map<string, CalendarEntry[]>()
  for (const item of calendar) {
    const id = entryIdOf(item)
    if (id) byEntry.set(id, [...(byEntry.get(id) ?? []), item])
  }
  const nudges: Nudge[] = []
  for (const entry of entries) {
    const items = (byEntry.get(entry.id) ?? []).toSorted((a, b) => a.day.localeCompare(b.day))
    if (PLANNED.has(entry.status)) {
      const next = items.find((item) => dayNumber(item.day) >= todayNumber)
      if (next) {
        const days = dayNumber(next.day) - todayNumber
        if (days <= 30) {
          const tier = days === 0 ? "today" : days <= 7 ? "week" : "month"
          nudges.push({
            kind: "last-chance",
            entry,
            days,
            day: next.day,
            tier,
            cycleYear: Number(next.day.slice(0, 4)),
          })
        }
      }
    }
    if (APPLIED.has(entry.status) && !reportedInstitutionIds.has(entry.institution.id)) {
      const past = items.findLast((item) => dayNumber(item.day) < todayNumber)
      if (past) {
        nudges.push({
          kind: "add-result",
          entry,
          days: 0,
          day: past.day,
          tier: "today",
          cycleYear: Number(past.day.slice(0, 4)),
        })
      }
    }
  }
  return nudges.toSorted((a, b) => (a.kind === b.kind ? a.days - b.days : a.kind === "last-chance" ? -1 : 1))
}

/** The "start here" rule: a student with no list item and no chosen field of study is still undecided. */
export function isUndecided({ listCount, hasField }: { listCount: number; hasField: boolean }): boolean {
  return listCount === 0 && !hasField
}
