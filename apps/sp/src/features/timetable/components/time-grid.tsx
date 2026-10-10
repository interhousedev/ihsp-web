"use client"

import type { LessonItem, LessonResult } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import {
  boxOf,
  clockOf,
  gapsBetween,
  hourMarks,
  intervalOf,
  laneLayout,
  minuteOfInstant,
  minutesToPx,
  timelineRange,
  type Gap,
} from "../utils/timeline"
import { TimetableLessonBlock } from "./timetable-lesson-block"

export type TimeColumn = {
  key: string
  label: string
  sublabel?: string
  /** Today's column: its header is highlighted and it carries the "now" line. */
  today: boolean
  lessons: readonly LessonItem[]
}

const AXIS_WIDTH = 52
const HEADER_HEIGHT = 48

/**
 * A day or a week on a vertical time axis: every lesson block is placed by its start and end (proportional to the
 * minutes), the time between lessons stays empty, gaps show a label ("Break" or "Free"), and today's column has the
 * "now" line. Overlapping lessons (two subgroups) sit side by side. Horizontal scroll keeps the columns readable.
 */
export function TimeGrid({
  columns,
  pxPerMinute,
  minColumnWidth,
  showHeaders = true,
  now,
  showSubgroup = false,
  results,
}: {
  columns: TimeColumn[]
  pxPerMinute: number
  /** px; below `columns * minColumnWidth` the grid scrolls sideways. */
  minColumnWidth: number
  showHeaders?: boolean
  now: number
  showSubgroup?: boolean
  results?: ReadonlyMap<string, LessonResult>
}) {
  const t = useT("timetable")
  const intervals = columns.flatMap((column) => column.lessons.map(intervalOf))
  const range = timelineRange(intervals)
  if (!range) return null

  const bodyHeight = minutesToPx(range.endMin - range.startMin, pxPerMinute)
  const nowMinute = minuteOfInstant(now)
  const nowTop =
    nowMinute >= range.startMin && nowMinute <= range.endMin
      ? minutesToPx(nowMinute - range.startMin, pxPerMinute)
      : null
  const marks = hourMarks(range)

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="flex" style={{ minWidth: AXIS_WIDTH + columns.length * minColumnWidth }}>
        <div className="relative shrink-0" style={{ width: AXIS_WIDTH }} aria-hidden>
          {showHeaders ? <div style={{ height: HEADER_HEIGHT }} /> : null}
          <div className="relative" style={{ height: bodyHeight }}>
            {marks.map((minute) => (
              <span
                key={minute}
                className="text-muted-foreground absolute right-1.5 -translate-y-1/2 text-[11px] tabular-nums"
                style={{ top: minutesToPx(minute - range.startMin, pxPerMinute) }}
              >
                {clockOf(minute)}
              </span>
            ))}
          </div>
        </div>
        {columns.map((column) => (
          <div key={column.key} className="min-w-0 flex-1 border-s" style={{ minWidth: minColumnWidth }}>
            {showHeaders ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center border-b px-1 text-center",
                  column.today && "text-primary",
                )}
                style={{ height: HEADER_HEIGHT }}
              >
                <span className="text-sm leading-tight font-medium">{column.label}</span>
                {column.sublabel ? (
                  <span className="text-muted-foreground text-xs leading-tight">{column.sublabel}</span>
                ) : null}
              </div>
            ) : null}
            <div className="relative" style={{ height: bodyHeight }}>
              {marks.map((minute) => (
                <div
                  key={minute}
                  aria-hidden
                  className="border-border/70 absolute inset-x-0 border-t"
                  style={{ top: minutesToPx(minute - range.startMin, pxPerMinute) }}
                />
              ))}
              {gapsBetween(column.lessons.map(intervalOf)).map((gap) => (
                <GapLabel
                  key={gap.startMin}
                  gap={gap}
                  box={boxOf(gap, range.startMin, pxPerMinute)}
                  label={
                    gap.kind === "free"
                      ? t("freeGap", { minutes: gap.minutes })
                      : t("breakGap", { minutes: gap.minutes })
                  }
                />
              ))}
              <ol
                aria-label={[column.label, column.sublabel].filter(Boolean).join(", ")}
                className="absolute inset-0 m-0 list-none p-0"
              >
                {laneLayout(column.lessons.map((lesson) => ({ lesson, ...intervalOf(lesson) }))).map(
                  ({ lesson, startMin, endMin, lane, lanes }) => {
                    const box = boxOf({ startMin, endMin }, range.startMin, pxPerMinute)
                    return (
                      <li
                        key={lesson.id}
                        className="absolute px-0.5"
                        style={{
                          top: box.top,
                          height: box.height,
                          left: `${(lane / lanes) * 100}%`,
                          width: `${100 / lanes}%`,
                        }}
                      >
                        <TimetableLessonBlock
                          lesson={lesson}
                          now={now}
                          showSubgroup={showSubgroup}
                          result={results?.get(lesson.id)}
                        />
                      </li>
                    )
                  },
                )}
              </ol>
              {column.today && nowTop !== null ? (
                <div
                  aria-hidden
                  data-now=""
                  className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                  style={{ top: nowTop }}
                >
                  <span className="bg-primary -ms-1 size-2 shrink-0 rounded-full" />
                  <span className="bg-primary h-px flex-1" />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GapLabel({ gap, box, label }: { gap: Gap; box: { top: number; height: number }; label: string }) {
  return (
    <div
      data-gap={gap.kind}
      className="absolute inset-x-0 flex items-center justify-center overflow-hidden"
      style={{ top: box.top, height: box.height }}
    >
      <span
        className={cn(
          "text-muted-foreground rounded px-1 text-[10px] leading-none whitespace-nowrap",
          gap.kind === "free" ? "bg-muted/60" : "italic",
        )}
      >
        {label}
      </span>
    </div>
  )
}
