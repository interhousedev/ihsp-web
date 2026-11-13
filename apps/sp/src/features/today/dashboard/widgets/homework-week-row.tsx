"use client"

import { getMeHomeworkQuery } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { dayMarks, groupByDueDate } from "../../../homework/utils/group-by-due-date"
import { schoolWeekOf } from "../../../homework/utils/week-paging"
import { addDays } from "@ihsp/i18n"

/** The school week as five days; a day with homework due gets a dot, red when something is overdue. */
export function HomeworkWeekRow() {
  const t = useT("today.dashboard")
  const f = useFormatters()
  const today = todayIso()
  const week = schoolWeekOf(today)
  const items = useQuery(getMeHomeworkQuery({ from: week.from, to: week.to })).data ?? []
  const marks = dayMarks(groupByDueDate(items))
  return (
    <ul aria-label={t("homeworkWeek")} className="flex justify-between gap-1">
      {Array.from({ length: 5 }, (_, index) => addDays(week.from, index)).map((date) => {
        const mark = marks.get(date)
        return (
          <li
            key={date}
            data-mark={mark ?? "none"}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-card py-1 text-xs",
              date === today && "bg-muted font-semibold",
            )}
          >
            <span className="text-muted-foreground">{f.weekday(date, "short")}</span>
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                mark === "error" ? "bg-destructive" : mark ? "bg-primary" : "bg-transparent",
              )}
            />
            {mark ? (
              <span className="sr-only">{t(mark === "error" ? "homeworkOverdueMark" : "homeworkDueMark")}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
