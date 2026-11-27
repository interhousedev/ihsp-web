"use client"

import type { LessonResult, StudentLessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { DayBlockItem } from "../api/day-blocks"
import { TimetableLessonBlock } from "./timetable-lesson-block"

type Entry =
  | { type: "lesson"; key: string; start: number; end: number; lesson: StudentLessonItem }
  | { type: "block"; key: string; start: number; end: number; block: DayBlockItem }
  | { type: "free"; key: string; start: number; end: number }

const MINUTE_MS = 60_000

/** A block carries a Tashkent date and wall-clock times (`12:30:00`); Asia/Tashkent is a fixed UTC+5. */
const blockInstant = (block: DayBlockItem, time: string) => `${block.date}T${time}+05:00`

/**
 * Lessons and day blocks (lunch, breaks, assemblies) of one day in time order; any time between them that no block
 * covers shows as a compact "N min · Free" row instead of empty space.
 */
export function buildAgenda(lessons: readonly StudentLessonItem[], blocks: readonly DayBlockItem[]): Entry[] {
  const timed: Entry[] = [
    ...lessons.map((lesson): Entry => ({
      type: "lesson",
      key: `l-${lesson.id}`,
      start: Date.parse(lesson.starts_at),
      end: Date.parse(lesson.ends_at),
      lesson,
    })),
    ...blocks.map((block): Entry => ({
      type: "block",
      key: `b-${block.id}`,
      start: Date.parse(blockInstant(block, block.starts_at)),
      end: Date.parse(blockInstant(block, block.ends_at)),
      block,
    })),
  ].sort((a, b) => a.start - b.start || a.end - b.end)
  const result: Entry[] = []
  let cursor: number | null = null
  for (const entry of timed) {
    if (cursor !== null && entry.start - cursor >= MINUTE_MS) {
      result.push({ type: "free", key: `f-${cursor}`, start: cursor, end: entry.start })
    }
    result.push(entry)
    cursor = cursor === null ? entry.end : Math.max(cursor, entry.end)
  }
  return result
}

function GapRow({
  minutes,
  reason,
  time,
  tone,
}: {
  minutes: string
  reason: string
  time?: string
  tone: "free" | "block"
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex min-h-8 items-center gap-2 rounded-md px-2 text-xs",
        tone === "block" ? "bg-muted" : "border border-dashed",
      )}
    >
      <span className="font-medium tabular-nums">{minutes}</span>
      <span aria-hidden>·</span>
      <span className="min-w-0 flex-1 truncate">{reason}</span>
      {time ? <span className="shrink-0 tabular-nums">{time}</span> : null}
    </div>
  )
}

export function DayAgenda({
  lessons,
  blocks,
  now,
  showSubgroup,
  results,
  excusedLessonIds,
  onOpenLesson,
}: {
  lessons: readonly StudentLessonItem[]
  blocks: readonly DayBlockItem[]
  now: number
  showSubgroup: boolean
  results: ReadonlyMap<string, LessonResult>
  excusedLessonIds: ReadonlySet<string>
  onOpenLesson: (lessonId: string) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const minutes = (entry: Entry) => t("gap.minutes", { count: Math.round((entry.end - entry.start) / MINUTE_MS) })

  return (
    <ol className="flex flex-col gap-1.5" aria-label={t("agenda")}>
      {buildAgenda(lessons, blocks).map((entry) => (
        <li key={entry.key}>
          {entry.type === "lesson" ? (
            <TimetableLessonBlock
              lesson={entry.lesson}
              now={now}
              showSubgroup={showSubgroup}
              result={results.get(entry.lesson.id)}
              excused={excusedLessonIds.has(entry.lesson.id)}
              onOpen={onOpenLesson}
            />
          ) : entry.type === "block" ? (
            <GapRow
              tone="block"
              minutes={minutes(entry)}
              reason={entry.block.name || t(`gap.kind.${entry.block.kind}`)}
              time={`${f.time(blockInstant(entry.block, entry.block.starts_at))}–${f.time(blockInstant(entry.block, entry.block.ends_at))}`}
            />
          ) : (
            <GapRow tone="free" minutes={minutes(entry)} reason={t("gap.free")} />
          )}
        </li>
      ))}
    </ol>
  )
}
