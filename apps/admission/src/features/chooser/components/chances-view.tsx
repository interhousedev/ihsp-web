"use client"

import { useT } from "@ihsp/i18n"
import { Icons, StateView, cn } from "@ihsp/ui"
import Link from "next/link"
import type { AdmissionChanceFactor as ChanceFactor } from "@ihsp/api"
import { useChances } from "../../discover/hooks"
import { StatusPill } from "../../discover/components/status-pill"
import { ChanceChart } from "./chance-chart"
import { useOptionLabel } from "./option-label"

const LEVEL_CLASS: Record<ChanceFactor["level"], string> = {
  strong: "border-success/40 bg-success-muted text-success",
  ok: "border-warning/40 bg-warning-muted text-warning",
  weak: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-hairline-strong bg-muted text-muted-foreground",
}

const REQUIRED: Record<ChanceFactor["key"], string[]> = {
  academics: ["yours", "median"],
  course_rigor: ["advanced", "total"],
  cost: ["cost", "budget"],
  location: ["country"],
  activities: ["count"],
}

export function FactorCard({ factor }: { factor: ChanceFactor }) {
  const t = useT("chooser")
  const countryName = useOptionLabel("country")
  const params: Record<string, string | number> = {}
  for (const [name, value] of Object.entries(factor.detail?.params ?? {})) {
    if (value !== null && value !== undefined) params[name] = name === "country" ? countryName(String(value)) : value
  }
  const showDetail = REQUIRED[factor.key].every((name) => name in params)
  return (
    <li
      data-testid={`factor-${factor.key}`}
      data-level={factor.level}
      className="bg-card border-hairline-strong rounded-card flex flex-col gap-2 border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t(`chances.factors.${factor.key}`)}
        </h3>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", LEVEL_CLASS[factor.level])}>
          {t(`chances.levels.${factor.level}`)}
        </span>
      </div>
      <p className="text-sm">{t(`chances.text.${factor.key}.${factor.level}`)}</p>
      {showDetail ? <p className="text-muted-foreground text-xs">{t(`chances.detail.${factor.key}`, params)}</p> : null}
      {params.estimated === 1 ? <p className="text-muted-foreground text-xs">{t("chances.estimated")}</p> : null}
      {factor.action ? (
        <Link href={factor.action.href} className="text-primary inline-flex items-center gap-1 text-sm font-medium">
          {t("chances.action")}
          <Icons.arrowRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </li>
  )
}

/** "What shapes your chances": status, five factor cards and the what-if chart. */
export function ChancesView({ institutionId }: { institutionId: string }) {
  const t = useT("chooser")
  const query = useChances(institutionId)
  if (query.isLoading) return <StateView state="loading" rows={3} />
  if (query.isError || !query.data)
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const chances = query.data
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {chances.status ? <StatusPill status={chances.status} /> : null}
        <p className="text-sm">{t(`chances.summary.${chances.summary_key}`)}</p>
      </div>
      <h2 className="text-base font-semibold">{t("chances.title")}</h2>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chances.factors.map((factor) => (
          <FactorCard key={factor.key} factor={factor} />
        ))}
      </ul>
      <ChanceChart simulation={chances.simulation} />
    </div>
  )
}
