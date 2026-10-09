"use client"

import type { SubjectPlanner } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageSection } from "../../../exams/components/page-section"
import { usePlannerLabels } from "../hooks/use-planner-labels"
import { formatMean } from "../utils/planner-view"
import { MarkStat } from "./mark-stat"

/** The marks the planner works from: an average and a count per kind, the semester mark so far and what is missing. */
export function PlannerSummary({ planner }: { planner: SubjectPlanner }) {
  const t = useT("planner.summary")
  const labels = usePlannerLabels()
  return (
    <PageSection title={t("title")}>
      <dl className="grid grid-cols-3 gap-2">
        <MarkStat type="lesson" stat={planner.lesson} />
        <MarkStat type="midterm" stat={planner.midterm} />
        <MarkStat type="final" stat={planner.final} />
      </dl>
      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-xs">{t("semesterMark")}</p>
        <p className="text-2xl font-bold tabular-nums" data-testid="planner-semester-mark">
          {planner.semester_mark === null ? t("noSemesterMark") : formatMean(planner.semester_mark)}
        </p>
        {planner.missing.length > 0 ? (
          <>
            <p className="text-sm font-medium" data-testid="planner-missing">
              {planner.missing.map((type) => labels.missing(type)).join(" · ")}
            </p>
            <p className="text-muted-foreground text-xs">{t("missingHint")}</p>
          </>
        ) : null}
      </div>
    </PageSection>
  )
}
