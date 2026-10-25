"use client"

import type { PlannerMarkType, PlannerStat } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { usePlannerLabels } from "../hooks/use-planner-labels"
import { formatMean } from "../utils/planner-view"

/** One kind of mark (lessons, midterms, final): its average and how many marks it rests on. */
export function MarkStat({ type, stat }: { type: PlannerMarkType; stat: PlannerStat }) {
  const t = useT("planner.summary")
  const labels = usePlannerLabels()
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border p-3" data-testid={`planner-stat-${type}`}>
      <dt className="text-muted-foreground text-xs">{labels.type(type)}</dt>
      <dd className="text-xl font-semibold tabular-nums">{formatMean(stat.average)}</dd>
      <dd className="text-muted-foreground text-xs">
        {stat.count === 0 ? t("noMarks") : t("count", { count: stat.count })}
      </dd>
    </div>
  )
}
