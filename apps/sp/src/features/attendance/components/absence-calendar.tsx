"use client"

import { getMeLessonResultsQuery, getMeTimetableQuery, type StudentAttendance } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { isWeekend } from "../../timetable/utils/week"
import { dayStatus } from "../utils/lesson-states"
import { lateDays } from "../utils/late-days"
import { monthGrid, monthRange, shiftMonth } from "../utils/month-grid"
import { STATE_TONE } from "../utils/state-tone"

/**
 * The month of the calendar with the attendance on the days: a red dot for the days with absences, an orange dot for
 * the days the student was late, a green dot for the days with only present lessons (the colours of the lesson
 * blocks). Every day can be tapped; `onSelect` opens it. The month is the page's (`?day=` keeps it in the address).
 */
export function AbsenceCalendar({
  days,
  month,
  onMonthChange,
  onSelect,
}: {
  days: StudentAttendance["days"]
  /** `2026-10` */
  month: string
  onMonthChange: (month: string) => void
  onSelect: (date: string) => void
}) {
  const t = useT("attendance.calendar")
  const f = useFormatters()
  const absences = new Map(days.map((day) => [day.date, day.absences]))
  const today = todayIso()
  const weeks = monthGrid(month)
  // Late and present come from the lesson results of the month, dated by the timetable.
  const range = monthRange(month)
  const lessons = useQuery(getMeTimetableQuery(range)).data
  const results = useQuery(getMeLessonResultsQuery(range)).data
  const late = useMemo(() => lateDays(lessons ?? [], results ?? []), [lessons, results])
  const status = useMemo(() => dayStatus(lessons ?? [], results ?? []), [lessons, results])
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
          onClick={() => onMonthChange(shiftMonth(month, -1))}
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
          onClick={() => onMonthChange(shiftMonth(month, 1))}
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
          const isPresent = !isLate && count === 0 && status.get(date) === "present"
          const plain = f.date(date, { day: "numeric", month: "long" })
          return (
            <Button
              key={date}
              variant="ghost"
              aria-label={count > 0 ? t("dayWithAbsences", { date: plain, count }) : plain}
              className={cn(
                "relative h-11 px-0 md:h-9",
                date === today && "ring-primary ring-1",
                // Saturday and Sunday have no lessons: the cells stay tappable but look empty.
                isWeekend(date) && "text-muted-foreground/60",
                count === 0 && !isLate && !isPresent && "opacity-60",
              )}
              onClick={() => onSelect(date)}
            >
              <span className="tabular-nums">{Number(date.slice(8))}</span>
              {count > 0 || isLate || isPresent ? (
                <span aria-hidden className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {count > 0 ? (
                    <span data-dot="absent" className={cn("size-1.5 rounded-full", STATE_TONE.absent.dot)} />
                  ) : null}
                  {isLate ? (
                    <span data-dot="late" className={cn("size-1.5 rounded-full", STATE_TONE.late.dot)} />
                  ) : null}
                  {isPresent ? (
                    <span data-dot="present" className={cn("size-1.5 rounded-full", STATE_TONE.present.dot)} />
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
