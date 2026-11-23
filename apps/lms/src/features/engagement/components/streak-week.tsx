"use client"

import type { EngagementStreak, StreakDayState } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"

export type StreakWeekProps = {
  streak: EngagementStreak
  /** Hide the "current / best / freezes" line, e.g. in a tight header. */
  compact?: boolean
  className?: string
}

const DOT: Record<StreakDayState, string> = {
  done: "bg-primary text-primary-foreground border-primary",
  bonus: "bg-primary/20 text-foreground border-primary border-dashed",
  freeze: "bg-info-muted text-info border-info",
  missed: "bg-destructive/10 text-destructive border-destructive/40",
  pending: "bg-background text-muted-foreground border-border",
}

/** The school week (Mon-Fri, weekends only as bonus) with the state of each day and the streak counters. */
export function StreakWeek({ streak, compact = false, className }: StreakWeekProps) {
  const t = useT("engagement")
  const format = useFormatters()
  // Date-only strings stay on that day; uz falls back to its own names where the browser has no Uzbek data.
  const weekday = (date: string) => format.date(date, { weekday: "short" })
  return (
    <div data-testid="streak-week" className={cn("flex flex-col gap-2", className)}>
      {compact ? null : (
        <p className="text-sm">
          <span className="text-2xl font-bold tabular-nums">{streak.current}</span>{" "}
          <span className="text-muted-foreground">{t("streakDays", { count: streak.current })}</span>
        </p>
      )}
      <ol aria-label={t("streakWeek")} className="flex gap-1.5">
        {streak.week.map((day) => {
          const label = `${weekday(day.date)}: ${t(`day.${day.state}`)}`
          return (
            <li key={day.date} className="flex flex-col items-center gap-1">
              <span
                role="img"
                data-state={day.state}
                aria-label={label}
                title={label}
                className={cn("grid size-8 place-items-center rounded-full border-2 text-xs font-bold", DOT[day.state])}
              >
                {day.state === "done" || day.state === "bonus" ? <Icons.check aria-hidden className="size-4" /> : null}
                {day.state === "freeze" ? <span aria-hidden>❄</span> : null}
                {day.state === "missed" ? <Icons.close aria-hidden className="size-4" /> : null}
              </span>
              <span aria-hidden className="text-muted-foreground text-[11px]">
                {weekday(day.date)}
              </span>
            </li>
          )
        })}
      </ol>
      {compact ? null : (
        <p className="text-muted-foreground text-xs">
          {t("streakBest", { count: streak.best })} · {t("freezes", { count: streak.freezes })}
          {streak.today_done ? null : <> · {t("todayPending")}</>}
        </p>
      )}
    </div>
  )
}
