"use client"

import { getLmsStepDiffQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { StepDiffView } from "../../shared/components/step-diff-view"

/** Loads the live content next to the draft of one step and shows them side by side. */
export function StepDiffLoader({ stepId }: { stepId: string }) {
  const diff = useQuery({ ...getLmsStepDiffQuery(stepId), staleTime: 0 })
  return (
    <QueryState query={diff} rows={2}>
      {(data) => <StepDiffView live={data.live} draft={data.draft} />}
    </QueryState>
  )
}
