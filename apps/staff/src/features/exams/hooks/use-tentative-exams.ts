"use client"

import { getStaffAssessmentsQuery, type StaffAssessmentItem } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { newestFirst } from "../utils/controls"

/**
 * The dates nobody confirmed yet in the teacher's subjects and groups, newest first: suggestions from EMIS lessons
 * outside a control week and from head students. The Today card and the group picker read the same query.
 */
export function useTentativeExams(): { items: StaffAssessmentItem[]; isPending: boolean } {
  const query = useQuery(getStaffAssessmentsQuery({ status: "tentative" }))
  const items = useMemo(() => newestFirst(query.data?.items ?? []), [query.data])
  return { items, isPending: query.isPending }
}
