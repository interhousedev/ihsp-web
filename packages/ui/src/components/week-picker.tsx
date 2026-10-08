"use client"

import { addDays, startOfWeek, todayIso, useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Button } from "./ui/button"

/** Week switcher. `value` and `onChange` use the Monday of the week (`YYYY-MM-DD`, Asia/Tashkent). */
export function WeekPicker({
  value,
  onChange,
  className,
}: {
  value: IsoDate
  onChange: (monday: IsoDate) => void
  className?: string
}) {
  const t = useT()
  const f = useFormatters()
  const monday = startOfWeek(value)
  const sunday = addDays(monday, 6)
  const thisWeek = startOfWeek(todayIso())
  const range = t("calendar.weekRange", {
    start: f.date(monday, { day: "numeric", month: "short" }),
    end: f.date(sunday, { day: "numeric", month: "short" }),
  })

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        onClick={() => onChange(addDays(monday, -7))}
        aria-label={t("calendar.previousWeek")}
      >
        <Icons.chevronLeft />
      </Button>
      <span className="min-w-36 px-2 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {range}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-11 md:size-8"
        onClick={() => onChange(addDays(monday, 7))}
        aria-label={t("calendar.nextWeek")}
      >
        <Icons.chevronRight />
      </Button>
      {monday !== thisWeek ? (
        <Button variant="ghost" className="min-h-11 md:min-h-8" onClick={() => onChange(thisWeek)}>
          {t("calendar.thisWeek")}
        </Button>
      ) : null}
    </div>
  )
}
