"use client"

import { getAdminAiUsageQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, PageContainer, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { lazy, Suspense } from "react"
import { QueryState } from "../../shared/components/query-state"
import { rangeOf, RANGES, todayIso, type RangeKey } from "../utils"
import { ExtensionsSection } from "./extensions-section"
import { LimitsEditor } from "./limits-editor"
import { DistributionCard, TopUsersCard, UsageSummary } from "./usage-report"

/** The only card with a chart: Recharts arrives in its own chunk once the usage rows are there. */
const DailyCostCard = lazy(() => import("./daily-cost-card"))

/** Limits & usage: what the AI costs and who uses it, the limits (with per-user extensions). */
export function LimitsPage() {
  const t = useT("limits")
  const tu = useT("limits.range")
  const [range, setRange] = useQueryState("range", parseAsStringLiteral(RANGES).withDefault("30"))
  const { from, to } = rangeOf(range, todayIso())
  const daily = useQuery(getAdminAiUsageQuery({ from, to, group_by: "day" }))
  const models = useQuery(getAdminAiUsageQuery({ from, to, group_by: "model" }))
  const roles = useQuery(getAdminAiUsageQuery({ from, to, group_by: "role" }))
  return (
    <PageContainer title={t("title")}>
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("title")}>
        {RANGES.map((value: RangeKey) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={range === value ? "default" : "outline"}
            aria-pressed={range === value}
            onClick={() => void setRange(value)}
          >
            {tu(value)}
          </Button>
        ))}
      </div>
      <QueryState query={daily} rows={3}>
        {(usage) => <UsageSummary usage={usage} />}
      </QueryState>
      <div className="grid gap-4 lg:grid-cols-2">
        <QueryState query={daily} rows={2}>
          {(usage) => (
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
              <DailyCostCard rows={usage.rows} />
            </Suspense>
          )}
        </QueryState>
        <QueryState query={models} rows={2}>
          {(usage) => <DistributionCard title={t("charts.byModel")} rows={usage.rows} label={(key) => key} />}
        </QueryState>
        <QueryState query={roles} rows={2}>
          {(usage) => (
            <DistributionCard
              title={t("charts.byRole")}
              rows={usage.rows}
              label={(key) => (t.has(`roles.${key}`) ? t(`roles.${key}`) : key)}
            />
          )}
        </QueryState>
        <QueryState query={daily} rows={2}>
          {(usage) => <TopUsersCard users={usage.top_users} />}
        </QueryState>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <LimitsEditor />
        <ExtensionsSection />
      </div>
    </PageContainer>
  )
}
