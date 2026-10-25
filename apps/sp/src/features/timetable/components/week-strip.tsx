"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { STATE_TONE } from "../../attendance/utils/state-tone"
import type { MarkedState } from "../../attendance/utils/lesson-states"
import { weekDays } from "../utils/week"

/** The seven days of the week as a compact strip to pick the day; a dot shows the day's attendance. */
export function WeekStrip({
  monday,
  selected,
  today,
  statuses,
  onChange,
}: {
  monday: string
  selected: string
  today: string
  statuses: ReadonlyMap<string, MarkedState>
  onChange: (date: string) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()

  return (
    <div role="group" aria-label={t("days")} className="grid grid-cols-5 gap-1">
      {weekDays(monday).map((date) => {
        const status = statuses.get(date)
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
            {status ? (
              <span
                aria-hidden
                data-dot={status}
                className={cn(
                  "absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full",
                  STATE_TONE[status].dot,
                )}
              />
            ) : null}
          </Button>
        )
      })}
    </div>
  )
}
