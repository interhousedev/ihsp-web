"use client"

import { getMeHomeworkQuery } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "@ihsp/features-core"
import { WeekStrip } from "../../timetable/components/week-strip"
import { dayMarks, groupByDueDate } from "../utils/group-by-due-date"
import { schoolWeekOf, shiftWeek } from "../utils/week-paging"
import { HomeworkItemCard } from "./homework-item-card"

/**
 * Homework by due date: a Monday-to-Friday strip with a dot on each day that has homework (red when something is
 * overdue) and the week's tasks below, grouped by their due date. A tapped day narrows the list to that day.
 */
export function HomeworkByDate() {
  const t = useT("homework.dates")
  const f = useFormatters()
  const today = todayIso()
  const [week, setWeek] = useState(() => schoolWeekOf(today))
  const [selected, setSelected] = useState(today)
  /** The tapped day; the list shows only its tasks until it is cleared. */
  const [onlyDay, setOnlyDay] = useState<string | null>(null)
  const query = useQuery(getMeHomeworkQuery({ from: week.from, to: week.to }))

  const pick = (date: string) => {
    setSelected(date)
    setOnlyDay(date)
  }
  const move = (weeks: -1 | 1) => {
    const next = shiftWeek(week.from, weeks)
    setWeek(next)
    setSelected(next.from)
    setOnlyDay(null)
  }
  const daysOf = (items: Parameters<typeof groupByDueDate>[0]) =>
    groupByDueDate(items).filter((day) =>
      onlyDay ? day.date === onlyDay : day.date >= week.from && day.date <= week.to,
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("previousWeek")}
          onClick={() => move(-1)}
        >
          <Icons.chevronLeft aria-hidden />
        </Button>
        <div className="flex-1">
          <WeekStrip
            monday={week.from}
            selected={selected}
            today={today}
            marks={dayMarks(
              groupByDueDate(query.data ?? []).filter((day) => day.date >= week.from && day.date <= week.to),
            )}
            onChange={pick}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("nextWeek")}
          onClick={() => move(1)}
        >
          <Icons.chevronRight aria-hidden />
        </Button>
      </div>
      <QueryState
        query={query}
        isEmpty={(items) => daysOf(items).length === 0}
        emptyText={onlyDay ? t("emptyDay") : t("empty")}
        emptyAction={
          onlyDay ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setOnlyDay(null)}>
              {t("showWeek")}
            </Button>
          ) : undefined
        }
      >
        {(items) => {
          const days = daysOf(items)
          return (
            <div className="flex flex-col gap-5">
              {onlyDay ? (
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setOnlyDay(null)}>
                  {t("showWeek")}
                </Button>
              ) : null}
              {days.map((day) => (
                <section
                  key={day.date}
                  id={`homework-day-${day.date}`}
                  className="flex flex-col gap-2"
                  aria-labelledby={`homework-day-title-${day.date}`}
                >
                  <h3
                    id={`homework-day-title-${day.date}`}
                    className={day.overdue ? "text-destructive text-sm font-semibold" : "text-sm font-semibold"}
                  >
                    {f.date(day.date, { weekday: "long", day: "numeric", month: "short" })}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {day.items.map((item) => (
                      <HomeworkItemCard key={item.lesson_id} item={item} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )
        }}
      </QueryState>
    </div>
  )
}
