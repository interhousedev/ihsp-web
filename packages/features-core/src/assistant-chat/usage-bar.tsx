"use client"

import type { UsageInfo } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Progress } from "@ihsp/ui"
import { formatTokens, usagePercent } from "./limit-info"

type UsageRowProps = {
  label: string
  used: number
  limit: number | null
  resetsAt: string | null
  resetLabel: string
}

function UsageRow({ label, used, limit, resetsAt, resetLabel }: UsageRowProps) {
  const percent = usagePercent(used, limit)
  const full = percent >= 100
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className={full ? "text-destructive font-medium" : "text-muted-foreground"}>
          {limit === null ? formatTokens(used) : `${formatTokens(used)} / ${formatTokens(limit)}`}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={label}
        className={full ? "[&_[data-slot=progress-indicator]]:bg-destructive" : undefined}
      />
      {resetsAt ? <span className="text-muted-foreground text-xs">{resetLabel}</span> : null}
    </div>
  )
}

/** Remaining assistant budget under the input: session (5 hours) and day (AI-8). */
export function UsageBar({ usage, stacked = false }: { usage: UsageInfo | undefined; stacked?: boolean }) {
  const t = useT("assistant.usage")
  const format = useFormatters()
  if (!usage) return null
  // Administration has no caps: nothing to meter.
  if (usage.session.limit === null && usage.day.limit === null) return null
  return (
    <div
      className={stacked ? "flex flex-col gap-3" : "flex flex-col gap-2 sm:flex-row sm:gap-4"}
      aria-label={t("title")}
      role="group"
    >
      <UsageRow
        label={t("session")}
        used={usage.session.used}
        limit={usage.session.limit}
        resetsAt={usage.session.resets_at}
        resetLabel={usage.session.resets_at ? t("resetsAt", { time: format.time(usage.session.resets_at) }) : ""}
      />
      <UsageRow
        label={t("day")}
        used={usage.day.used}
        limit={usage.day.limit}
        resetsAt={usage.day.resets_at}
        resetLabel={usage.day.resets_at ? t("resetsAt", { time: format.time(usage.day.resets_at) }) : ""}
      />
    </div>
  )
}
