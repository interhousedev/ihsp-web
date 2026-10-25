"use client"

import type { PlannerTarget, SubjectPlanner } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { useId } from "react"
import { formatMean, targetView } from "../utils/planner-view"
import { TargetAdvice } from "./target-advice"
import { TargetStatusBadge } from "./target-status-badge"

/** One grade (5, 4 or 3): the semester mark it takes, whether it is secured, needed or out of reach, and what to get. */
export function TargetCard({ target, remaining }: { target: PlannerTarget; remaining: SubjectPlanner["remaining"] }) {
  const t = useT("planner.target")
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} data-testid={`planner-target-${target.grade}`}>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 id={titleId} className="text-base font-semibold">
                {t("grade", { grade: target.grade })}
              </h3>
              <p className="text-muted-foreground text-xs">
                {t("threshold", { threshold: formatMean(target.threshold) })}
              </p>
            </div>
            <TargetStatusBadge status={target.status} />
          </div>
          <TargetAdvice view={targetView(target, remaining)} />
        </CardContent>
      </Card>
    </section>
  )
}
