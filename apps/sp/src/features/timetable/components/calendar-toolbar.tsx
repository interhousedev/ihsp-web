"use client"

import { addDays, startOfWeek, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { samePeriod, VIEWS, type CalendarView } from "../utils/view"

/**
 * The view switch (day, week, month) and the step through the period. The month view has its own month header in the
 * calendar, so only the view switch and "Today" show there.
 */
export function CalendarToolbar({
  view,
  day,
  today,
  onViewChange,
  onStep,
  onToday,
}: {
  view: CalendarView
  day: string
  today: string
  onViewChange: (view: CalendarView) => void
  onStep: (direction: 1 | -1) => void
  onToday: () => void
}) {
  const t = useT("timetable")
  const cal = useT("calendar")
  const f = useFormatters()
  const labels: Record<CalendarView, string> = {
    day: t("views.day"),
    week: t("views.week"),
    month: t("views.month"),
  }
  const isCurrent = samePeriod(view, day, today)
  const stepLabels =
    view === "day"
      ? { previous: cal("previousDay"), next: cal("nextDay") }
      : { previous: cal("previousWeek"), next: cal("nextWeek") }
  const monday = startOfWeek(day)
  const label =
    view === "day"
      ? f.date(day, { weekday: "long", day: "numeric", month: "long" })
      : cal("weekRange", {
          start: f.date(monday, { day: "numeric", month: "short" }),
          end: f.date(addDays(monday, 4), { day: "numeric", month: "short" }),
        })

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div role="group" aria-label={t("viewsLabel")} className="bg-muted inline-flex rounded-md p-0.5">
        {VIEWS.map((item) => (
          <Button
            key={item}
            variant={item === view ? "default" : "ghost"}
            size="sm"
            aria-pressed={item === view}
            className="min-h-11 min-w-16 md:min-h-8"
            onClick={() => onViewChange(item)}
          >
            {labels[item]}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {view === "month" ? null : (
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              aria-label={stepLabels.previous}
              onClick={() => onStep(-1)}
            >
              <Icons.chevronLeft aria-hidden />
            </Button>
            <span className="min-w-40 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
              {label}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              aria-label={stepLabels.next}
              onClick={() => onStep(1)}
            >
              <Icons.chevronRight aria-hidden />
            </Button>
          </>
        )}
        {isCurrent ? null : (
          <Button variant="ghost" className="min-h-11 md:min-h-8" onClick={onToday}>
            {t("today")}
          </Button>
        )}
      </div>
    </div>
  )
}
