"use client"

import type { FlashcardStats } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useMemo } from "react"
import { buildHeatmapWeeks, monthStarts, type HeatmapLevel } from "../utils/heatmap"
import { ReviewStatsSummary } from "./review-stats-summary"

const LEVEL_CLASS: Record<HeatmapLevel, string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
}

export type ReviewHeatmapProps = {
  stats: FlashcardStats
  /** Called with the year to show when the student uses the arrows; leave out to hide the navigation. */
  onYearChange?: (year: number) => void
  /** Today as `YYYY-MM-DD` in Tashkent; the default is read from the clock. */
  today?: string
  className?: string
}

/**
 * Anki's review heatmap: one square per day of the year, in weeks that start on Monday, darker for busier days, with
 * year navigation and the four numbers underneath (daily average, days learned, longest and current streak).
 */
export function ReviewHeatmap({ stats, onYearChange, today = todayIso(), className }: ReviewHeatmapProps) {
  const t = useT("flashcards.heatmap")
  const format = useFormatters()
  const thisYear = Number(today.slice(0, 4))
  const firstYear = stats.first_review_date ? Number(stats.first_review_date.slice(0, 4)) : thisYear
  const weeks = useMemo(() => buildHeatmapWeeks(stats.year, stats.days, today), [stats.year, stats.days, today])
  const months = useMemo(() => monthStarts(weeks), [weeks])

  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10)
    return format.weekday(day, "narrow")
  })

  function cellTitle(date: string, count: number): string {
    const when = format.date(date, { day: "numeric", month: "long", year: "numeric" })
    return count > 0 ? t("cell", { count, date: when }) : t("noReviews", { date: when })
  }

  return (
    <section className={cn("flex min-w-0 flex-col items-center gap-2", className)} aria-label={t("title")}>
      {onYearChange ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 md:size-7"
            aria-label={t("previousYear")}
            disabled={stats.year <= firstYear}
            onClick={() => onYearChange(stats.year - 1)}
          >
            <Icons.chevronLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-w-16 tabular-nums"
            aria-label={t("thisYear")}
            disabled={stats.year === thisYear}
            onClick={() => onYearChange(thisYear)}
          >
            {stats.year}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 md:size-7"
            aria-label={t("nextYear")}
            disabled={stats.year >= thisYear}
            onClick={() => onYearChange(stats.year + 1)}
          >
            <Icons.chevronRight aria-hidden />
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm tabular-nums">{stats.year}</p>
      )}

      <div
        role="img"
        aria-label={t("summary", { year: stats.year, count: stats.total_reviews, days: stats.days_studied })}
        className="max-w-full overflow-x-auto pb-1"
        data-testid="review-heatmap"
      >
        <div className="flex gap-1">
          <div className="text-muted-foreground flex flex-col gap-1 pe-1 text-[10px] leading-3" aria-hidden>
            {weekdayLabels.map((label, index) => (
              <span key={index} className="flex h-3 items-center">
                {label}
              </span>
            ))}
          </div>
          <div>
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((cell, dayIndex) =>
                    cell ? (
                      <span
                        key={cell.date}
                        title={cellTitle(cell.date, cell.count)}
                        data-date={cell.date}
                        data-count={cell.count}
                        data-level={cell.level}
                        className={cn(
                          "size-3 rounded-[3px]",
                          cell.future ? "bg-muted/40" : LEVEL_CLASS[cell.level],
                          cell.date === today && "ring-foreground/60 ring-1 ring-offset-1",
                        )}
                      />
                    ) : (
                      <span key={`blank-${dayIndex}`} className="size-3" aria-hidden />
                    ),
                  )}
                </div>
              ))}
            </div>
            <div
              className="text-muted-foreground mt-1 grid gap-1 text-[10px] leading-3"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, 0.75rem)` }}
              aria-hidden
            >
              {months.map(({ week, month }) => (
                <span key={month} className="whitespace-nowrap" style={{ gridColumnStart: week + 1 }}>
                  {format.date(new Date(Date.UTC(stats.year, month, 1)), { month: "short" })}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ReviewStatsSummary stats={stats} />
    </section>
  )
}
