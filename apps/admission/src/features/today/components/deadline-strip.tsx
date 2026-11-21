"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { dayTone, daysBetween, shortDate } from "../dates"
import type { DeadlineItem } from "../today-mock"

/** The dated things coming up, nearest first, on a horizontal strip (a scrolling row on a phone). */
export function DeadlineStrip({
  items,
  today,
  later,
  className,
}: {
  items: DeadlineItem[]
  today: string
  /** A note that replaces the strip tail while applying is not yet open (grade 10). */
  later?: boolean
  className?: string
}) {
  const t = useT("today")
  const locale = useLocale()
  const sorted = items.toSorted((a, b) => a.date.localeCompare(b.date))
  return (
    <section aria-label={t("deadlines.title")} className={cn("flex min-w-0 items-center gap-3", className)}>
      <h2 className="text-muted-foreground hidden text-xs font-medium tracking-wide uppercase lg:block">{t("deadlines.title")}</h2>
      <ul className="-mx-4 flex min-w-0 flex-1 snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 [scrollbar-width:none]">
        {sorted.length === 0 ? <li className="text-muted-foreground text-sm">{t("deadlines.empty")}</li> : null}
        {sorted.map((item) => {
          const days = daysBetween(today, item.date)
          return (
            <li
              key={item.id}
              className="bg-card flex shrink-0 snap-start items-center gap-2.5 rounded-xl border px-3 py-2"
            >
              <span className="flex flex-col items-center leading-none">
                <span className="text-muted-foreground text-[10px] uppercase">{shortDate(item.date, locale).split(" ")[1] ?? ""}</span>
                <span className="text-base font-semibold tabular-nums">{shortDate(item.date, locale).split(" ")[0]}</span>
              </span>
              <span className="flex flex-col gap-0.5 leading-tight">
                <span className="text-sm font-medium whitespace-nowrap">{item.kind === "reply" && !item.name ? t("deadlines.replyAll") : t(`deadlines.${item.kind}`, { name: item.name ?? "" })}</span>
                <span className={cn("text-xs font-medium tabular-nums", dayTone(days))}>
                  {days === 0 ? t("deadlines.today") : t("deadlines.days", { n: days })}
                </span>
              </span>
            </li>
          )
        })}
        {later ? (
          <li className="text-muted-foreground flex shrink-0 items-center rounded-xl border border-dashed px-3 py-2 text-sm">
            {t("deadlines.later")}
          </li>
        ) : null}
      </ul>
    </section>
  )
}
