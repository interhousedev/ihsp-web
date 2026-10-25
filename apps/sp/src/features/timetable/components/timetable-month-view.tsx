"use client"

import type { StudentAttendance } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { AbsenceCalendar } from "../../attendance/components/absence-calendar"
import { MissedLessons } from "../../attendance/components/missed-lessons"

/** The month view: the month with the attendance on its days, then the lessons missed in the month. */
export function TimetableMonthView({
  month,
  days,
  missed,
  onMonthChange,
  onPickDay,
}: {
  /** `2026-10` */
  month: string
  days: StudentAttendance["days"]
  missed: StudentAttendance["missed"]
  onMonthChange: (month: string) => void
  /** A tapped day opens in the day view. */
  onPickDay: (date: string) => void
}) {
  const t = useT("attendance")
  const inMonth = missed.filter((item) => item.lesson.date.startsWith(`${month}-`))

  return (
    <div className="flex flex-col gap-6">
      <AbsenceCalendar days={days} month={month} onMonthChange={onMonthChange} onSelect={onPickDay} />
      <section aria-labelledby="missed-title" className="flex flex-col gap-2">
        <h2 id="missed-title" className="text-base font-semibold">
          {t("missedTitle")}
        </h2>
        <MissedLessons missed={inMonth} />
      </section>
    </div>
  )
}
