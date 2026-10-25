"use client"

import type { LessonItem } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { CalendarGrid, type CalendarGridColumn } from "@ihsp/ui"
import { lessonsAt, periodsOf, weekDays } from "../utils/week"
import { TimetableLessonCard } from "./timetable-lesson-card"

/** The week as a grid: the five school days (Mon–Fri) across, periods down (desktop). Lessons on other dates are not drawn. */
export function TimetableWeekGrid({ monday, lessons, now }: { monday: string; lessons: LessonItem[]; now: number }) {
  const t = useT("timetable")
  const f = useFormatters()
  const today = todayIso()
  const days = weekDays(monday)
  // Lessons dated outside Mon–Fri are ignored, so they add neither a column nor an empty period row.
  const drawn = lessons.filter((lesson) => days.includes(lesson.date))
  const columns: CalendarGridColumn[] = days.map((date) => ({
    key: date,
    label: f.weekday(date),
    sublabel: f.date(date, { day: "numeric", month: "short" }),
    highlight: date === today,
  }))
  const rows = periodsOf(drawn).map((period) => ({
    key: String(period.period),
    label: t("period", { number: period.period }),
    sublabel: `${f.time(period.starts_at)}–${f.time(period.ends_at)}`,
  }))

  return (
    <CalendarGrid
      columns={columns}
      rows={rows}
      minColumnWidth={150}
      cornerLabel={t("periodHeader")}
      renderCell={(rowKey, columnKey) => (
        <div className="flex flex-col gap-1.5">
          {lessonsAt(drawn, columnKey, Number(rowKey)).map((lesson) => (
            <TimetableLessonCard key={lesson.id} lesson={lesson} now={now} />
          ))}
        </div>
      )}
    />
  )
}
