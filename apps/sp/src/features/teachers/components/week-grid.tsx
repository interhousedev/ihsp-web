"use client"

import type { TeacherLesson } from "@ihsp/api"
import { addDays, startOfWeek, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { lessonsByWeekday } from "../utils/teacher-display"

/** The week's lessons by day: time, subject, group and room. Sunday only appears when there is a lesson. */
export function WeekGrid({ week }: { week: TeacherLesson[] }) {
  const t = useT("teachers.detail")
  const format = useFormatters()
  const byDay = lessonsByWeekday(week)
  const monday = startOfWeek(todayIso())
  const today = todayIso()
  const days = [1, 2, 3, 4, 5, 6, 7].filter((day) => day < 7 || byDay.has(7))
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="week-grid">
      {days.map((day) => {
        const date = addDays(monday, day - 1)
        const lessons = byDay.get(day) ?? []
        return (
          <section
            key={day}
            aria-label={format.weekday(date, "long")}
            className={cn("bg-card flex flex-col gap-2 rounded-xl border p-3", date === today && "border-primary")}
          >
            <h3 className="text-sm font-semibold">
              {format.weekday(date, "long")}{" "}
              <span className="text-muted-foreground font-normal">
                {format.date(date, { day: "numeric", month: "short" })}
              </span>
            </h3>
            {lessons.length === 0 ? <p className="text-muted-foreground text-sm">{t("noLessonsDay")}</p> : null}
            <ul className="flex flex-col gap-2">
              {lessons.map((lesson) => (
                <li key={`${lesson.starts_at}-${lesson.subject}`} className="flex flex-col text-sm">
                  <span className="font-medium">
                    {format.time(lesson.starts_at)}–{format.time(lesson.ends_at)} · {lesson.subject}
                  </span>
                  <span className="text-muted-foreground">
                    {[lesson.group, lesson.room ? t("room", { room: lesson.room }) : null].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
