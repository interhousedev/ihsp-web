const DAY = 86_400_000

export type GanttTone = "primary" | "success" | "danger" | "warning" | "muted" | "info" | "accent"

/** One dated thing on the chart before it is turned into a block. */
export type Entry = {
  id: string
  /** Row it sits on; rows appear in first-seen order inside their group. */
  rowId: string
  rowLabel: string
  /** Group heading id: `uni:<list entry id>`, `general` or `mine`. */
  group: string
  kind: "task" | "test" | "registration" | "deadline"
  title: string
  start: number
  end: number
  tone: GanttTone
  href: string | null
  /** Caption under the title: the source or the task status. */
  caption: string
  /** The task this entry draws, when it is one. */
  taskId?: string
  predicted?: boolean
  /** Two or three letters beside a deadline flag: which kind of date it is. */
  short?: string
}

export type Block = {
  id: string
  rowId: string
  rowLabel: string
  group: Entry["group"]
  shape: "bar" | "flag"
  start: number
  end: number
  tone: GanttTone
  entries: Entry[]
}

export function utcDay(value: string): number {
  return Date.parse(`${value.slice(0, 10)}T00:00:00Z`)
}

export function utcDayToIso(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

/** Bars stay alone; one-day entries on the same row and day collapse into one flag listing all of them. */
export function toBlocks(entries: Entry[]): Block[] {
  const blocks: Block[] = []
  const flags = new Map<string, Block>()
  for (const entry of entries) {
    const single = entry.kind === "test" || entry.kind === "registration"
    const bar = entry.kind === "task" || (entry.kind === "test" && entry.end > entry.start)
    if (bar || single) {
      blocks.push({ ...head(entry), id: entry.id, shape: bar ? "bar" : "flag", entries: [entry] })
      continue
    }
    const key = `${entry.rowId}:${entry.start}`
    const found = flags.get(key)
    if (found) {
      found.entries.push(entry)
      if (entry.tone === "danger") found.tone = "danger"
    } else {
      const block: Block = { ...head(entry), id: `flag:${key}`, shape: "flag", entries: [entry] }
      flags.set(key, block)
      blocks.push(block)
    }
  }
  return blocks
}

function head(entry: Entry) {
  return {
    rowId: entry.rowId,
    rowLabel: entry.rowLabel,
    group: entry.group,
    start: entry.start,
    end: entry.end,
    tone: entry.tone,
  }
}

/** Days of the past the chart still shows before today. */
export const BACK_DAYS = 14
/** The chart is never shorter than this many days from today. */
export const MIN_DAYS = 70

/**
 * Visible span: from two weeks back (or the earliest task bar, so an overdue task never drops off the chart) to the last
 * dated item (at least ten weeks); both ends are capped at 400 days from today. Past deadline flags do not widen it.
 */
export function chartRange(blocks: Block[], today: number): { start: number; end: number } {
  const last = Math.max(today + MIN_DAYS * DAY, ...blocks.map((block) => block.end))
  const first = Math.min(
    today - BACK_DAYS * DAY,
    ...blocks.filter((block) => block.shape === "bar").map((block) => block.start),
  )
  return { start: Math.max(first, today - 400 * DAY), end: Math.min(last, today + 400 * DAY) }
}

export type DeadlineKind = "early" | "regular" | "aid" | "other"

/** Kind of a university deadline from its title (the backend sends only the localized text). */
export function deadlineKind(title: string): DeadlineKind {
  if (/\b(ED2?|EA|REA|SCEA)\b|early|ранн|erta/i.test(title)) return "early"
  if (/aid|css|fafsa|финанс|стипенд|moliyaviy|grant|грант/i.test(title)) return "aid"
  if (/\b(RD|UCAS)\b|regular|обычн|стандарт|oddiy|umumiy/i.test(title)) return "regular"
  return "other"
}

/** Where a task about one university points: the institution page of the chooser (a plain link, not a grouping key). */
export function institutionUrl(institutionId: string): string {
  return `/chooser/institution/?id=${institutionId}`
}
