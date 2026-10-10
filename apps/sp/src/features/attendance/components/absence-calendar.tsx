"use client"

import { getMeLessonResultsQuery, getMeTimetableQuery, type StudentAttendance } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { lateDays } from "../utils/late-days"
import { monthGrid, monthOf, monthRange, shiftMonth } from "../utils/month-grid"

/**
 * A month calendar with the days that have absences marked (red dot) and the days the student was late (orange dot),
 * the same colours as the timetable; tapping a day with absences selects it (WEB-17, UF-WEB-12).
 */
export function AbsenceCalendar({
  days,
  to,
  selected,
  onSelect,
}: {
  days: StudentAttendance["days"]
  /** The end of the period: the calendar opens on its month. */
  to: string
  selected: string | null
  onSelect: (date: string | null) => void
}) {
  const t = useT("attendance.calendar")
  const f = useFormatters()
  const [month, setMonth] = useState(monthOf(to < todayIso() ? to : todayIso()))
  const absences = new Map(days.map((day) => [day.date, day.absences]))
  const today = todayIso()
  const weeks = monthGrid(month)
  // Late is not in the day counts: it comes from the lesson results of the month, dated by the timetable.
  const range = monthRange(month)
  const lessons = useQuery(getMeTimetableQuery(range)).data
  const results = useQuery(getMeLessonResultsQuery(range)).data
  const late = useMemo(() => lateDays(lessons ?? [], results ?? []), [lessons, results])
  // Any Monday gives the seven weekday names in the user's language.
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => f.weekday(addDays("2026-10-05", index), "short"))

  return (
    <section aria-label={t("label")} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("previousMonth")}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <Icons.chevronLeft aria-hidden />
        </Button>
        <h3 className="text-sm font-semibold capitalize">
          {f.date(`${month}-01`, { month: "long", year: "numeric" })}
        </h3>
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("nextMonth")}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <Icons.chevronRight aria-hidden />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <span key={label} aria-hidden className="text-muted-foreground text-xs">
            {label}
          </span>
        ))}
        {weeks.flat().map((date, index) => {
          if (date === null) return <span key={`empty-${index}`} aria-hidden />
          const count = absences.get(date) ?? 0
          const isLate = late.has(date)
          return (
            <Button
              key={date}
              variant={selected === date ? "default" : "ghost"}
              aria-pressed={selected === date}
              aria-label={
                count > 0
                  ? t("dayWithAbsences", { date: f.date(date, { day: "numeric", month: "long" }), count })
                  : f.date(date, { day: "numeric", month: "long" })
              }
              disabled={count === 0}
              className={cn(
                "relative h-11 px-0 md:h-9",
                date === today && "ring-primary ring-1",
                count === 0 && !isLate && "opacity-60",
              )}
              onClick={() => onSelect(selected === date ? null : date)}
            >
              <span className="tabular-nums">{Number(date.slice(8))}</span>
              {count > 0 || isLate ? (
                <span aria-hidden className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {count > 0 ? (
                    <span data-dot="absent" className="size-1.5 rounded-full bg-red-800 dark:bg-red-500" />
                  ) : null}
                  {isLate ? (
                    <span data-dot="late" className="size-1.5 rounded-full bg-orange-700 dark:bg-orange-500" />
                  ) : null}
                </span>
              ) : null}
            </Button>
          )
        })}
      </div>
    </section>
  )
}
