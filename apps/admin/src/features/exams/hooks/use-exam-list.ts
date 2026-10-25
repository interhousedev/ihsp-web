"use client"

import { getAdminAssessmentsQuery, type StaffAssessmentList } from "@ihsp/api"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"
import { useFilterState } from "../../shared/hooks/use-filter-state"
import { useControlPeriods } from "../../shared/hooks/use-control-periods"
import { useTerms } from "../../shared/hooks/use-lookups"
import { EXAM_FILTER_KEYS, examParams, inControl, selectedControl, sortExams } from "../utils/exam-filters"

/**
 * The exams list for the filters in the URL: the request, the rows in date order and, for a chosen control week, only
 * the rows of that week. The request waits for the terms when a week is chosen, because the week's dates come from them.
 */
export function useExamList() {
  const filters = useFilterState(EXAM_FILTER_KEYS)
  const terms = useTerms()
  const periods = useControlPeriods()
  const control = selectedControl(filters.values.control)
  const params = useMemo(() => examParams(filters.values, periods), [filters.values, periods])
  const select = useCallback(
    (data: StaffAssessmentList) => sortExams(data.items.filter((item) => inControl(item, control))),
    [control],
  )
  const query = useQuery({
    ...getAdminAssessmentsQuery(params),
    select,
    placeholderData: keepPreviousData,
    enabled: control === null || !terms.isPending,
  })
  return { filters, params, periods, query }
}
