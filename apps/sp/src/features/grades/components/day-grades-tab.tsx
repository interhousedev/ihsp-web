"use client"

import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, DatePicker, Icons, MarkBadge } from "@ihsp/ui"
import Link from "next/link"
import { parseAsString, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { useDayGrades } from "../hooks/use-grades"
import { shiftStudyDay } from "../utils/study-days"

/** Marks of one day placed on their lessons; marks without a lesson are listed apart (WEB-14, UF-WEB-10). */
export function DayGradesTab() {
  const t = useT("grades.day")
  const f = useFormatters()
  const today = todayIso()
  const [dateParam, setDate] = useQueryState("date", parseAsString)
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today
  const query = useDayGrades(date)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("previous")}
          onClick={() => void setDate(shiftStudyDay(date, -1))}
        >
          <Icons.chevronLeft aria-hidden />
        </Button>
        <DatePicker
          value={date}
          max={today}
          aria-label={t("pick")}
          onChange={(next) => void setDate(next)}
          className="min-w-44"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("next")}
          disabled={date >= today}
          onClick={() => void setDate(shiftStudyDay(date, 1))}
        >
          <Icons.chevronRight aria-hidden />
        </Button>
      </div>
      <QueryState
        query={query}
        isEmpty={(day) => day.lessons.length === 0 && day.unmatched.length === 0}
        emptyText={t("empty")}
        rows={3}
      >
        {(day) => (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {day.lessons.map(({ lesson, marks }) => (
                <li key={lesson.id}>
                  <Link
                    href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
                    className="hover:bg-accent focus-visible:ring-ring flex min-h-14 items-center gap-3 rounded-lg border p-3 outline-none focus-visible:ring-2"
                  >
                    <span className="text-muted-foreground w-12 shrink-0 text-xs tabular-nums">
                      {f.time(lesson.starts_at)}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium">{lesson.subject.name}</span>
                    <span className="flex items-center gap-1">
                      {marks.map((mark, index) => (
                        <MarkBadge key={`${mark.type}-${index}`} mark={mark.value} size="lg" />
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {day.unmatched.length > 0 ? (
              <section aria-labelledby="unmatched-marks" className="flex flex-col gap-2">
                <h3 id="unmatched-marks" className="text-sm font-semibold">
                  {t("unmatched")}
                </h3>
                <ul className="flex flex-col gap-2">
                  {day.unmatched.map((mark, index) => (
                    <li
                      key={`${mark.subject.id}-${index}`}
                      className="flex min-h-11 items-center gap-3 rounded-lg border p-2"
                    >
                      <MarkBadge mark={mark.value} size="lg" />
                      <span className="text-sm">
                        {mark.subject.name} · {t(`type.${mark.type}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </QueryState>
    </div>
  )
}
