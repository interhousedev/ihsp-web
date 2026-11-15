"use client"

import type { ControlPeriodItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { formatPeriod } from "../../exams/utils/period"

export const CONTROL_TONE: Record<ControlPeriodItem["kind"], string> = {
  midterm: "bg-primary/15 text-primary",
  final: "bg-warning/25 text-foreground",
  other: "bg-muted text-foreground",
}

/** The all-day event of a control week: a bar with the term, drawn on every date of the period. */
export function ControlPeriodBar({
  period,
  edge,
  showLabel,
  onOpen,
  className,
  id,
}: {
  period: ControlPeriodItem
  edge: "single" | "start" | "end" | "middle"
  /** The term is written once per row: on the first date of the period in it. */
  showLabel: boolean
  /** Without it the bar is plain decoration. */
  onOpen?: () => void
  className?: string
  id?: string
}) {
  const t = useT("timetable.controlPeriod")
  const f = useFormatters()
  const tone = cn(
    "flex h-5 w-full min-w-0 items-center truncate px-1.5 text-[11px] leading-none font-medium",
    CONTROL_TONE[period.kind],
    (edge === "start" || edge === "single") && "rounded-s-md",
    (edge === "end" || edge === "single") && "rounded-e-md",
    className,
  )
  const label = showLabel ? t(`short.${period.control}`) : null
  // Inside a date button the bar is only drawn; the button itself opens the period.
  if (!onOpen) {
    return (
      <span id={id} data-control-period={period.control} className={tone}>
        {label}
      </span>
    )
  }
  return (
    <button
      type="button"
      data-control-period={period.control}
      aria-label={t("open", {
        term: t(`short.${period.control}`),
        period: formatPeriod(period, (date, options) => f.date(date, options)),
      })}
      className={cn(tone, "focus-visible:ring-ring/50 focus-visible:ring-[3px]")}
      onClick={onOpen}
    >
      {label}
    </button>
  )
}
