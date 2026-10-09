"use client"

import type { PlannerAssumption } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageSection } from "../../../exams/components/page-section"
import { usePlannerLabels } from "../hooks/use-planner-labels"

/** What the numbers rest on: one line for each code the planner sent. */
export function PlannerAssumptions({ assumptions }: { assumptions: PlannerAssumption[] }) {
  const t = useT("planner.assumptions")
  const labels = usePlannerLabels()
  if (assumptions.length === 0) return null
  return (
    <PageSection title={t("title")}>
      <ul
        className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm"
        data-testid="planner-assumptions"
      >
        {assumptions.map((code) => (
          <li key={code}>{labels.assumption(code)}</li>
        ))}
      </ul>
    </PageSection>
  )
}
