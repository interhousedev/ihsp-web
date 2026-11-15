"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { useEffect, useRef } from "react"
import type { MarkedState } from "../../attendance/utils/lesson-states"
import { STATE_TONE } from "../../attendance/utils/state-tone"

const NO_STATUSES: ReadonlyMap<string, MarkedState> = new Map()

/**
 * The days of the week as a horizontally scrollable strip of pills ("Mon, 16"); the selected day is filled with the
 * brand colour and scrolled into view. A dot under a pill shows the day's attendance.
 */
export function DayPills({
  days,
  selected,
  today,
  statuses = NO_STATUSES,
  onChange,
}: {
  days: readonly string[]
  selected: string
  today: string
  statuses?: ReadonlyMap<string, MarkedState>
  onChange: (date: string) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView?.({ inline: "center", block: "nearest" })
  }, [selected])

  return (
    <div ref={strip} role="group" aria-label={t("days")} className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {days.map((date) => {
        const status = statuses.get(date)
        return (
          <Button
            key={date}
            variant={date === selected ? "default" : "outline"}
            aria-pressed={date === selected}
            aria-label={f.date(date, { weekday: "long", day: "numeric", month: "long" })}
            className={cn(
              "relative min-h-11 shrink-0 rounded-full px-4 text-sm font-medium tabular-nums",
              date === today && date !== selected && "border-primary",
            )}
            onClick={() => onChange(date)}
          >
            {f.weekday(date)}, {f.date(date, { day: "numeric" })}
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
