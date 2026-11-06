"use client"

import { getMeLessonResultsQuery, getMeTimetableQuery, type StudentAttendance } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useCurriculum } from "../../subjects/hooks/use-curriculum"
import { academicWeek } from "../../timetable/utils/academic-week"
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
  const semesters = useCurriculum().data?.semesters ?? []

  function weekNumberCell(week: (string | null)[], index: number) {
    const date = week.find((item) => item !== null)
    const number = date ? academicWeek(date, semesters) : null
    return (
      <span
        key={`week-${index}`}
        data-testid="academic-week"
        className="text-muted-foreground flex items-center justify-center text-[11px] tabular-nums"
        {...(number === null ? { "aria-hidden": true } : { role: "img", "aria-label": t("academicWeek", { number }) })}
      >
        {number}
      </span>
    )
  }

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
      <div className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-1 text-center">
        <span aria-hidden className="text-muted-foreground py-1 text-[10px] font-medium">
          {t("weekColumn")}
        </span>
        {weekdayLabels.map((label) => (
          <span key={label} aria-hidden className="text-foreground/70 py-1 text-xs font-medium">
            {label}
          </span>
        ))}
        {weeks
          .flatMap((week, weekIndex) => [weekNumberCell(week, weekIndex), ...week])
          .map((date, index) => {
            if (date === null) return <span key={`empty-${index}`} aria-hidden />
            if (typeof date !== "string") return date
            const count = absences.get(date) ?? 0
            const isLate = late.has(date)
            const isPresent = !isLate && count === 0 && status.get(date) === "present"
            const isToday = date === today
            const plain = f.date(date, { day: "numeric", month: "long" })
            return (
              <Button
                key={date}
                variant="ghost"
                aria-label={count > 0 ? t("dayWithAbsences", { date: plain, count }) : plain}
                aria-current={isToday ? "date" : undefined}
                data-weekend={isWeekend(date) ? "true" : "false"}
                className={cn(
                  "flex h-auto min-h-11 w-full flex-col items-center justify-center gap-1 rounded-lg px-0 py-1 font-normal md:min-h-10",
                  "hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  // Saturday and Sunday have no lessons; the text keeps AA contrast but reads as quieter than a school day.
                  isWeekend(date) && "text-foreground/70",
                )}
                onClick={() => onSelect(date)}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm tabular-nums",
                    isToday && "bg-primary text-primary-foreground font-semibold",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <span aria-hidden className="flex h-1.5 items-center justify-center gap-0.5">
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
              </Button>
            )
          })}
      </div>
    </section>
  )
}
