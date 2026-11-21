"use client"

import { todayIso, useLocale, useT } from "@ihsp/i18n"
import { cn, Pill } from "@ihsp/ui"
import { DeadlineChip } from "../../../components/lib/deadline-chip"
import { deadlineTone } from "../../../lib/deadline-tone"
import { useNow } from "../../../lib/use-now"
import type { Deadline } from "../types"
import { useOptionLabel } from "./option-label"

/** The next deadline of the chosen round: its date and countdown, or why there is none (with the official site). */
export function NextDeadline({
  deadlines,
  round,
  nextDeadline = null,
  officialUrl = null,
  compact = false,
}: {
  deadlines: Deadline[]
  round: string
  nextDeadline?: string | null
  officialUrl?: string | null
  /** Date and countdown only, for a table cell. */
  compact?: boolean
}) {
  const t = useT("chooser")
  const locale = useLocale()
  const roundLabel = useOptionLabel("round")
  const now = useNow(60_000)
  const today = todayIso(now)
  const dated = deadlines.filter((item) => item.plan === round).toSorted((a, b) => a.date.localeCompare(b.date))
  const upcoming = nextDeadline && nextDeadline >= today ? nextDeadline : dated.find((item) => item.date >= today)?.date
  const next = upcoming ? { date: upcoming, round: dated.find((item) => item.date === upcoming) } : null
  if (!next && dated.length > 0)
    return <p className="text-muted-foreground mt-0.5 text-xs">{t("list.noUpcomingDeadline")}</p>
  if (!next)
    return (
      <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
        <span>{t("list.deadlineMissing", { round: roundLabel(round) })}</span>
        {officialUrl ? (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {t("list.officialSite")}
          </a>
        ) : null}
      </p>
    )
  const date = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${next.date}T00:00:00Z`))
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
      {compact ? null : <span className="text-muted-foreground">{t("list.deadline")}</span>}
      <span className={cn("tabular-nums", deadlineTone(next.date, now) === "urgent" && "text-destructive font-medium")}>
        {date}
      </span>
      <DeadlineChip date={next.date} />
      {next.round && !compact ? <Pill>{next.round.plan}</Pill> : null}
      {next.round?.binding === true ? <Pill tone="warning">{t("list.binding")}</Pill> : null}
    </p>
  )
}
