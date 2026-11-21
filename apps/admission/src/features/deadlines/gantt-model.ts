const DAY = 86_400_000

export type GanttTone = "primary" | "success" | "danger" | "warning" | "muted"

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

/** Visible span: a month back and a quarter ahead at least, stretched to every item, capped to 400 days ahead. */
export function chartRange(blocks: Block[], today: number): { start: number; end: number } {
  const first = Math.min(today - 30 * DAY, ...blocks.map((block) => block.start))
  const last = Math.max(today + 120 * DAY, ...blocks.map((block) => block.end))
  return { start: first, end: Math.min(last, today + 400 * DAY) }
}

/** Where a task about one university points: the institution page of the chooser (a plain link, not a grouping key). */
export function institutionUrl(institutionId: string): string {
  return `/chooser/institution/?id=${institutionId}`
}
