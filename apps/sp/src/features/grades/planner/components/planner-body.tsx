"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useState } from "react"
import { BackLink } from "../../../shared/components/back-link"
import { QueryState } from "../../../shared/components/query-state"
import { usePlanner } from "../hooks/use-planner"
import { gradesHref } from "../utils/hrefs"
import type { WhatIfMark } from "../utils/what-if"
import { PlannerPrediction } from "./planner-prediction"
import { PlannerSummary } from "./planner-summary"
import { PlannerTargets } from "./planner-targets"
import { WhatIfEditor } from "./what-if-editor"

/**
 * The planner of one subject. It owns the marks being tried out; each change asks the planner again and the previous
 * answer stays until the new one comes. The editor stays when the answer fails, so a mark that breaks it can be removed.
 */
export function PlannerBody({ subjectId, semester }: { subjectId: string; semester: number | null }) {
  const t = useT("planner")
  const [marks, setMarks] = useState<WhatIfMark[]>([])
  const query = usePlanner(subjectId, semester, marks)
  const planner = query.data
  return (
    <PageContainer
      title={planner?.subject.name ?? t("title")}
      description={planner ? t("headline", { semester: planner.semester }) : undefined}
    >
      <BackLink href={gradesHref(planner?.semester ?? semester ?? undefined)} label={t("back")} />
      <div className="flex max-w-4xl flex-col gap-6">
        <QueryState query={query} rows={4}>
          {(data) => (
            <>
              <PlannerSummary planner={data} />
              <PlannerPrediction planner={data} busy={query.isPlaceholderData} />
              <PlannerTargets planner={data} />
            </>
          )}
        </QueryState>
        <WhatIfEditor marks={marks} onChange={setMarks} />
      </div>
    </PageContainer>
  )
}
