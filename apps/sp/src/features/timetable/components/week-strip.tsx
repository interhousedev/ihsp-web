"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { STATE_TONE } from "../../attendance/utils/state-tone"
import type { MarkedState } from "../../attendance/utils/lesson-states"
import { weekDays } from "../utils/week"

const NO_STATUSES: ReadonlyMap<string, MarkedState> = new Map()
const NO_MARKS: ReadonlyMap<string, "error" | "primary"> = new Map()

/** The seven days of the week as a compact strip to pick the day; a dot shows the day's attendance. */
export function WeekStrip({
  monday,
  lessons = [],
  selected,
  today,
  statuses = NO_STATUSES,
  marks = NO_MARKS,
  onChange,
}: {
  monday: string
  lessons?: readonly { date: string }[]
  selected: string
  today: string
  statuses?: ReadonlyMap<string, MarkedState>
  /** Other dots on a day (homework due: `primary`, overdue: `error`); the attendance `statuses` win on the same day. */
  marks?: ReadonlyMap<string, "error" | "primary">
  onChange: (date: string) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const days = weekDays(monday, lessons)

  return (
    <div
      role="group"
      aria-label={t("days")}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((date) => {
        const status = statuses.get(date)
        const mark = marks.get(date)
        const dot = status
          ? STATE_TONE[status].dot
          : mark === "error"
            ? "bg-destructive"
            : mark
              ? date === selected
                ? "bg-primary-foreground"
                : "bg-primary"
              : null
        return (
          <Button
            key={date}
            variant={date === selected ? "default" : "outline"}
            aria-pressed={date === selected}
            aria-label={f.date(date, { weekday: "long", day: "numeric", month: "long" })}
            className={cn(
              "relative h-auto min-h-11 flex-col gap-0 px-0 py-1",
              date === today && date !== selected && "border-primary",
            )}
            onClick={() => onChange(date)}
          >
            <span className="text-[11px] leading-tight">{f.weekday(date)}</span>
            <span className="text-sm leading-tight font-semibold tabular-nums">{f.date(date, { day: "numeric" })}</span>
            {dot ? (
              <span
                aria-hidden
                data-dot={status ?? mark}
                className={cn("absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full", dot)}
              />
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}
