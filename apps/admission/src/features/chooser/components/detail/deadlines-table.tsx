"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import type { Deadline } from "../../types"

const TASHKENT = "Asia/Tashkent"

/** The calendar date of a deadline, formatted in Asia/Tashkent. */
export function formatDeadlineDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: TASHKENT }).format(parsed)
}

/** Application deadlines: plan chip, date (with the school's time zone when known), cycle, binding badge. */
export function DeadlinesTable({ items }: { items: Deadline[] }) {
  const t = useT("chooserDetails")
  const locale = useLocale()
  return (
    <div className="flex flex-col gap-2" data-testid="deadlines">
      <h3 className="text-sm font-semibold">{t("deadlines.title")}</h3>
      <ul className="border-hairline-strong rounded-card divide-y border text-sm" aria-label={t("deadlines.title")}>
        {items.map((item, index) => (
          <li
            key={`${item.plan}-${item.date}-${index}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5"
          >
            <Badge variant="neutral">{item.plan}</Badge>
            <span className="font-medium">
              {formatDeadlineDate(item.date, locale)}
              {item.time_zone ? <span className="text-muted-foreground font-normal"> ({item.time_zone})</span> : null}
            </span>
            {item.cycle ? <span className="text-muted-foreground">{item.cycle}</span> : null}
            {item.binding ? <Badge variant="warning">{t("deadlines.binding")}</Badge> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
