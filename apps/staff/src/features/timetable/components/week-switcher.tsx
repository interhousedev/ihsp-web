"use client"

import { addDays, startOfWeek, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

/** Previous / next week and "this week"; `monday` is the Monday of the week shown (`YYYY-MM-DD`). */
export function WeekSwitcher({ monday, onChange }: { monday: string; onChange: (monday: string) => void }) {
  const t = useT("calendar")
  const f = useFormatters()
  const thisWeek = startOfWeek(todayIso())
  const range = t("weekRange", {
    start: f.date(monday, { day: "numeric", month: "short" }),
    end: f.date(addDays(monday, 4), { day: "numeric", month: "short" }),
  })

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        aria-label={t("previousWeek")}
        onClick={() => onChange(addDays(monday, -7))}
      >
        <Icons.chevronLeft aria-hidden />
      </Button>
      <span className="min-w-36 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {range}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        aria-label={t("nextWeek")}
        onClick={() => onChange(addDays(monday, 7))}
      >
        <Icons.chevronRight aria-hidden />
      </Button>
      {monday !== thisWeek ? (
        <Button variant="ghost" className="min-h-11 md:min-h-8" onClick={() => onChange(thisWeek)}>
          {t("thisWeek")}
        </Button>
      ) : null}
    </div>
  )
}
