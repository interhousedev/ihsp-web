"use client"

import type { SubjectPlanner } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageSection } from "../../../exams/components/page-section"
import { TargetCard } from "./target-card"

/** A card for each grade the planner talks about (5, 4, 3), best first as the answer lists them. */
export function PlannerTargets({ planner }: { planner: SubjectPlanner }) {
  const t = useT("planner.targets")
  return (
    <PageSection title={t("title")}>
      <div className="grid gap-3 md:grid-cols-3">
        {planner.targets.map((target) => (
          <TargetCard key={target.grade} target={target} remaining={planner.remaining} />
        ))}
      </div>
    </PageSection>
  )
}
