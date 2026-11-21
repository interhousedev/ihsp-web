"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"
import type { TodayDeadline } from "../api"
import { dayTone, daysBetween, dedupeDeadlines, shortDate } from "../dates"

/** The three nearest dated things, one line each (desktop only: on a phone the dates sit under the rings). */
export function DeadlineStrip({
  items,
  today,
  className,
}: {
  items: TodayDeadline[]
  today: string
  className?: string
}) {
  const t = useT("today")
  const locale = useLocale()
  const nearest = dedupeDeadlines(items).slice(0, 3)
  return (
    <section aria-label={t("deadlines.title")} className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t("deadlines.title")}</h2>
        <Link href="/deadlines/" className="text-primary text-xs font-medium hover:underline">
          {t("deadlines.all")}
        </Link>
      </div>
      {nearest.length === 0 ? <p className="text-muted-foreground text-sm">{t("deadlines.empty")}</p> : null}
      <ul className="flex flex-col">
        {nearest.map((item) => {
          const days = daysBetween(today, item.date)
          return (
            <li key={`${item.kind}-${item.date}-${item.title}`}>
              <Link href={item.href} className="hover:bg-muted/50 flex items-center gap-2 rounded-md py-1 text-sm">
                <span className="text-muted-foreground w-14 shrink-0 tabular-nums">{shortDate(item.date, locale)}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                <span className={cn("text-xs font-medium tabular-nums", dayTone(days))}>
                  {days === 0 ? t("deadlines.today") : t("deadlines.days", { n: days })}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
