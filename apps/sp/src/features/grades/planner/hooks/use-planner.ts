"use client"

import { getMeSubjectPlannerQuery, type PlannerParams } from "@ihsp/api"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { formatWhatIf, type WhatIfMark } from "../utils/what-if"

/**
 * The planner of one subject (`GET /v1/me/subjects/{id}/planner`). Every change of the what-if marks asks again;
 * the previous answer stays on screen until the new one comes, so the page does not flash.
 */
export function usePlanner(subjectId: string | null, semester: number | null, marks: WhatIfMark[]) {
  const params: PlannerParams = {}
  if (semester) params.semester = semester
  if (marks.length > 0) params.what_if = formatWhatIf(marks)
  return useQuery({
    ...getMeSubjectPlannerQuery(subjectId ?? "", params),
    enabled: subjectId !== null,
    placeholderData: keepPreviousData,
  })
}
