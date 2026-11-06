"use client"

import { getMeGradesDayQuery, type DayGrades } from "@ihsp/api"
import { addDays, startOfWeek, todayIso, useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, MarkBadge, Skeleton, cn } from "@ihsp/ui"
import { useQueries } from "@tanstack/react-query"
import { monthGrid, monthOf, shiftMonth } from "../../attendance/utils/month-grid"
import { isWeekend, weekDays } from "../../timetable/utils/week"

export type PeriodView = "week" | "month"

type DayMark = { key: string; subject: string; value: number }

/** Every mark of a day, with or without a lesson. */
function marksOf(day: DayGrades | undefined): DayMark[] {
  if (!day) return []
  const onLessons = day.lessons.flatMap(({ lesson, marks }) =>
    marks.map((mark, index) => ({
      key: `${lesson.id}-${mark.type}-${index}`,
      subject: lesson.subject.name,
      value: mark.value,
    })),
  )
  const apart = day.unmatched.map((mark, index) => ({
    key: `${mark.subject.id}-${mark.type}-${index}`,
    subject: mark.subject.name,
    value: mark.value,
  }))
  return [...onLessons, ...apart]
}

/** The marks as a calendar of a week or a month; a tapped day opens in the day view. */
export function GradesPeriodView({
  view,
  date,
  onDateChange,
  onPickDay,
}: {
  view: PeriodView
  date: string
  onDateChange: (date: string) => void
  onPickDay: (date: string) => void
}) {
  const t = useT("grades.day")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const today = todayIso()
  const monday = startOfWeek(date)
  const month = monthOf(date)
  const grid = monthGrid(month)
  const shown =
    view === "week" ? weekDays(monday) : grid.flat().filter((day): day is string => day !== null && !isWeekend(day))
  // Only past study days can hold marks, so the future asks nothing.
  const asked = shown.filter((day) => day <= today)
  const queries = useQueries({ queries: asked.map((day) => getMeGradesDayQuery(day)) })
  const byDate = new Map(asked.map((day, index) => [day, marksOf(queries[index]?.data)]))
  const failed = queries.find((query) => query.isError)
  const loading = queries.some((query) => query.isPending)

  const previous = view === "week" ? addDays(monday, -7) : `${shiftMonth(month, -1)}-01`
  const next = view === "week" ? addDays(monday, 7) : `${shiftMonth(month, 1)}-01`
  const dayLabel = (day: string) =>
    t("dayMarks", {
      date: f.date(day, { weekday: "short", day: "numeric", month: "long" }),
      count: byDate.get(day)?.length ?? 0,
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={view === "week" ? t("previousWeek") : t("previousMonth")}
          onClick={() => onDateChange(previous)}
        >
          <Icons.chevronLeft aria-hidden />
        </Button>
        <span className="min-w-40 px-2 text-center text-sm font-medium capitalize tabular-nums" aria-live="polite">
          {view === "week"
            ? `${f.date(monday, { day: "numeric", month: "short" })} – ${f.date(addDays(monday, 4), { day: "numeric", month: "short" })}`
            : f.date(`${month}-01`, { month: "long", year: "numeric" })}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={view === "week" ? t("nextWeek") : t("nextMonth")}
          disabled={next > today}
          onClick={() => onDateChange(next)}
        >
          <Icons.chevronRight aria-hidden />
        </Button>
      </div>
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(failed.error)}
        </p>
      ) : loading ? (
        <Skeleton className="h-56 w-full" />
      ) : view === "week" ? (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-5" data-testid="grades-week">
          {shown.map((day) => (
            <li key={day} className="flex flex-col gap-1 rounded-lg border p-2">
              <Button
                variant="ghost"
                aria-label={dayLabel(day)}
                className="min-h-11 justify-start px-1 text-sm font-medium md:min-h-8"
                onClick={() => onPickDay(day)}
              >
                {f.date(day, { weekday: "short", day: "numeric" })}
              </Button>
              <ul className="flex flex-col gap-1">
                {(byDate.get(day) ?? []).map((mark) => (
                  <li key={mark.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 break-words">{mark.subject}</span>
                    <MarkBadge mark={mark.value} size="sm" />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center" data-testid="grades-month">
          {Array.from({ length: 7 }, (_, index) => {
            const label = f.weekday(addDays("2026-10-05", index), "short")
            return (
              <span key={label} aria-hidden className="text-foreground/70 py-1 text-xs font-medium">
                {label}
              </span>
            )
          })}
          {grid.flat().map((day, index) => {
            if (day === null) return <span key={`empty-${index}`} aria-hidden />
            const marks = byDate.get(day) ?? []
            return (
              <Button
                key={day}
                variant="ghost"
                aria-label={dayLabel(day)}
                aria-current={day === today ? "date" : undefined}
                className={cn(
                  "flex h-auto min-h-14 w-full flex-col items-center justify-start gap-1 rounded-lg px-0 py-1 font-normal",
                  isWeekend(day) && "text-foreground/70",
                  day === today && "border-primary border",
                )}
                onClick={() => onPickDay(day)}
              >
                <span className="text-sm tabular-nums">{Number(day.slice(8))}</span>
                <span className="flex flex-wrap justify-center gap-0.5">
                  {marks.map((mark) => (
                    <MarkBadge key={mark.key} mark={mark.value} size="sm" />
                  ))}
                </span>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
