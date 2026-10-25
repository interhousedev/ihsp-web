"use client"

import type { SubjectPlanner } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { PageSection } from "../../../exams/components/page-section"
import { formatMean, predictionKind } from "../utils/planner-view"

/**
 * The predicted semester mark and the marks it assumed for the remaining controls. The text is a polite live region,
 * so a screen reader announces the new prediction when a what-if mark changes it.
 */
export function PlannerPrediction({ planner, busy }: { planner: SubjectPlanner; busy: boolean }) {
  const t = useT("planner.prediction")
  const { predicted } = planner
  const kind = predictionKind(predicted)
  return (
    <PageSection title={t("title")}>
      <Card>
        <CardContent aria-live="polite" aria-atomic="true" aria-busy={busy} className="flex flex-col gap-1">
          <p className="text-4xl font-bold tabular-nums" data-testid="planner-predicted">
            {formatMean(predicted.value)}
          </p>
          <p className="text-muted-foreground text-sm" data-testid="planner-predicted-note">
            {kind === "both" ? t("both", { midterm: predicted.midterm ?? 0, final: predicted.final ?? 0 }) : null}
            {kind === "midterm" ? t("midterm", { midterm: predicted.midterm ?? 0 }) : null}
            {kind === "final" ? t("final", { final: predicted.final ?? 0 }) : null}
            {kind === "none" ? t("none") : null}
            {kind === "unknown" ? t("unknown") : null}
          </p>
        </CardContent>
      </Card>
    </PageSection>
  )
}
