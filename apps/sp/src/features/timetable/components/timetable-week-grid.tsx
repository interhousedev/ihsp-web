"use client"

import type { LessonItem } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { CalendarGrid, type CalendarGridColumn } from "@ihsp/ui"
import { lessonsAt, periodsOf } from "../utils/week"
import { TimetableLessonCard } from "./timetable-lesson-card"

/** The week as a grid: days across, periods down (desktop). Sunday appears only when it has lessons. */
export function TimetableWeekGrid({
  monday,
  lessons,
  now,
  showSubgroup,
}: {
  monday: string
  lessons: LessonItem[]
  now: number
  showSubgroup: boolean
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const today = todayIso()
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index)).filter(
    (date, index) => index < 6 || lessons.some((lesson) => lesson.date === date),
  )
  const columns: CalendarGridColumn[] = days.map((date) => ({
    key: date,
    label: f.weekday(date),
    sublabel: f.date(date, { day: "numeric", month: "short" }),
    highlight: date === today,
  }))
  const rows = periodsOf(lessons).map((period) => ({
    key: String(period.period),
    label: t("period", { number: period.period }),
    sublabel: `${f.time(period.starts_at)}–${f.time(period.ends_at)}`,
  }))

  return (
    <CalendarGrid
      columns={columns}
      rows={rows}
      minColumnWidth={150}
      renderCell={(rowKey, columnKey) => (
        <div className="flex flex-col gap-1.5">
          {lessonsAt(lessons, columnKey, Number(rowKey)).map((lesson) => (
            <TimetableLessonCard key={lesson.id} lesson={lesson} now={now} showSubgroup={showSubgroup} />
          ))}
        </div>
      )}
    />
  )
}
