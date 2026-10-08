"use client"

import type { LessonItem } from "@ihsp/api"
import { addDays, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, StateView, cn } from "@ihsp/ui"
import { lessonsOn } from "../utils/week"
import { TimetableLessonCard } from "./timetable-lesson-card"

/** One day of the week as a list with a day selector (phone default, UF-WEB-03). */
export function TimetableDayList({
  monday,
  day,
  onDayChange,
  lessons,
  now,
  showSubgroup,
}: {
  monday: string
  day: string
  onDayChange: (day: string) => void
  lessons: LessonItem[]
  now: number
  showSubgroup: boolean
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const today = todayIso()
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index))
  const items = lessonsOn(lessons, day)

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t("days")} className="grid grid-cols-7 gap-1">
        {days.map((date) => (
          <Button
            key={date}
            variant={date === day ? "default" : "outline"}
            aria-pressed={date === day}
            aria-label={f.date(date, { weekday: "long", day: "numeric", month: "long" })}
            className={cn(
              "h-auto min-h-11 flex-col gap-0 px-0 py-1",
              date === today && date !== day && "border-primary",
            )}
            onClick={() => onDayChange(date)}
          >
            <span className="text-[11px] leading-tight">{f.weekday(date)}</span>
            <span className="text-sm leading-tight font-semibold tabular-nums">{f.date(date, { day: "numeric" })}</span>
          </Button>
        ))}
      </div>
      {items.length === 0 ? (
        <StateView state="empty" emptyText={t("noLessons")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((lesson) => (
            <li key={lesson.id}>
              <TimetableLessonCard lesson={lesson} now={now} showTime showSubgroup={showSubgroup} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
