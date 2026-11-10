"use client"

import { getMeTimetableQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { addDays, useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { Checkbox } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useId } from "react"

/** How far past an open start the lessons are offered. */
const OPEN_ENDED_DAYS = 13

/** Optional: the lessons of the period from the student's timetable; none selected means the whole days. */
export function ExcuseLessonPicker({
  from,
  to,
  value,
  onChange,
}: {
  from: IsoDate
  to: IsoDate | null
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const t = useT("excuses")
  const f = useFormatters()
  const ids = useId()
  const range = { from, to: to ?? addDays(from, OPEN_ENDED_DAYS) }
  const query = useQuery(getMeTimetableQuery(range))
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("form.lessons")}</legend>
      <QueryState query={query} rows={2} isEmpty={(lessons) => lessons.length === 0} emptyText={t("form.noLessons")}>
        {(lessons) => (
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
            {lessons
              .filter((lesson) => lesson.status !== "cancelled")
              .map((lesson) => {
                const id = `${ids}-${lesson.id}`
                const checked = value.includes(lesson.id)
                return (
                  <li key={lesson.id} className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(next) =>
                        onChange(next === true ? [...value, lesson.id] : value.filter((v) => v !== lesson.id))
                      }
                    />
                    <label htmlFor={id} className="flex-1 text-sm">
                      {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })},{" "}
                      {t("form.lessonLabel", { period: lesson.period, subject: lesson.subject.name })}
                    </label>
                  </li>
                )
              })}
          </ul>
        )}
      </QueryState>
    </fieldset>
  )
}
