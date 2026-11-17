"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Pill, Skeleton, StateView } from "@ihsp/ui"
import { StatCard, StatGrid } from "../../../components/lib/page"
import { useOutcomeSummary, type OutcomeTally } from "../api"

const TONE = {
  accepted: "success",
  enrolled: "success",
  waitlisted: "warning",
  deferred: "warning",
  rejected: "danger",
  applied: "neutral",
} as const

function TallyCard({ tally, showName }: { tally: OutcomeTally; showName: boolean }) {
  const t = useT("outcomes")
  return (
    <li className="bg-card rounded-card flex min-w-0 flex-col gap-4 border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {showName ? <h3 className="text-base font-semibold">{tally.institution_name}</h3> : <span />}
        <span className="text-muted-foreground text-xs tabular-nums">{t("cycleValue", { cycle: tally.cycle })}</span>
      </div>
      <p className="text-muted-foreground text-sm">
        {t("tally", { applied: tally.applied, accepted: tally.accepted })}
      </p>
      <ul className="flex flex-wrap gap-2" aria-label={t("byStatus")}>
        {Object.entries(tally.by_status).map(([status, count]) => (
          <li key={status}>
            <Pill tone={TONE[status as keyof typeof TONE] ?? "neutral"} className="h-6 px-2 text-xs">
              {t(`status.${status}`)} · {count}
            </Pill>
          </li>
        ))}
      </ul>
      {tally.names.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-sm" aria-label={t("names")}>
          {tally.names.map((entry, index) => (
            <li key={`${entry.name}-${index}`} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Icons.user aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {t(`status.${entry.status}`)} · {t(`plan.${entry.plan}`)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/**
 * What students reported for universities: counts per cycle and the names of those who agreed to share them. With an
 * `institutionId` it is the block of that university's page (the name is left out of the cards).
 */
export function OutcomeSummary({ institutionId }: { institutionId?: string }) {
  const t = useT("outcomes")
  const summary = useOutcomeSummary(institutionId)
  if (summary.isPending) return <Skeleton className="h-32 w-full" />
  if (summary.isError) return <StateView state="error" error={summary.error} onRetry={() => void summary.refetch()} />
  const { items, applied, accepted } = summary.data
  return (
    <div className="flex min-w-0 flex-col gap-4">
      {institutionId ? null : (
        <StatGrid className="lg:grid-cols-2">
          <StatCard label={t("stats.applied")} value={applied} icon="students" />
          <StatCard label={t("stats.accepted")} value={accepted} icon="check" />
        </StatGrid>
      )}
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("summaryEmpty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((tally) => (
            <TallyCard key={`${tally.institution_id}-${tally.cycle}`} tally={tally} showName={!institutionId} />
          ))}
        </ul>
      )}
    </div>
  )
}
