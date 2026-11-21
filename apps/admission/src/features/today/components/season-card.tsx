"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { SEASONS, type SeasonId, type TodayCheck } from "../api"
import type { TodayDeadline } from "../api"
import { DeadlineStrip } from "./deadline-strip"
import { Rhythm } from "./rhythm"

/** Six dots, one per season; the current one carries the name. The strip is the "where am I in the 14 months". */
export function SeasonStrip({ season }: { season: SeasonId }) {
  const t = useT("today")
  const current = SEASONS.indexOf(season)
  return (
    <div className="flex flex-col gap-1.5">
      <ol className="flex gap-1" aria-label={t("season.label")}>
        {SEASONS.map((id, index) => (
          <li
            key={id}
            aria-current={index === current ? "step" : undefined}
            title={t(`season.name.${id}`)}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index < current ? "bg-primary" : index === current ? "bg-primary" : "bg-muted",
            )}
            style={index === current ? { flexGrow: 2.2 } : index < current ? { opacity: 0.45 } : undefined}
          />
        ))}
      </ol>
      <p className="text-sm font-semibold">
        <span className="text-muted-foreground font-normal">{t("season.label")}: </span>
        {t(`season.name.${season}`)}
      </p>
    </div>
  )
}

export function SeasonCard({
  season,
  checks,
  streak,
  readiness,
  deadlines,
  today,
  className,
}: {
  season: SeasonId
  checks: TodayCheck[]
  streak: { days: number; last7: boolean[] }
  readiness: number
  deadlines: TodayDeadline[]
  today: string
  className?: string
}) {
  const t = useT("today")
  return (
    <section className={cn("bg-card rounded-card flex min-w-0 flex-col gap-3 border p-4 md:p-5", className)}>
      <SeasonStrip season={season} />
      <p className="text-muted-foreground text-xs leading-snug">{t(`season.hint.${season}`)}</p>
      <h2 className="sr-only">{t("check.title")}</h2>
      <ul className="flex flex-col gap-1.5">
        {checks.map((check) => (
          <li key={check.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                check.done ? "bg-success border-success text-success-foreground" : "border-muted-foreground/40",
              )}
            >
              {check.done ? <Icons.check className="size-3.5" /> : null}
            </span>
            <span className={cn("min-w-0 flex-1", check.done && "text-muted-foreground line-through")}>
              {check.href && !check.done ? (
                <Link
                  href={check.href}
                  className="hover:text-primary focus-visible:ring-ring rounded-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2"
                >
                  {check.label}
                </Link>
              ) : (
                check.label
              )}
            </span>
            {check.progress ? (
              <span className="text-muted-foreground text-xs tabular-nums">{check.progress}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-auto hidden border-t pt-3 lg:block">
        <DeadlineStrip items={deadlines} today={today} />
      </div>
      <div className="hidden border-t pt-3 lg:block">
        <Rhythm streak={streak} readiness={readiness} />
      </div>
    </section>
  )
}
