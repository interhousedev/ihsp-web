import type { AdminStudentsParams } from "@ihsp/api"
import type { FilterValues } from "../../shared/hooks/use-filter-state"
import { emisStatusParam, studentStatusParam } from "../../shared/utils/status-param"

export const STUDENT_FILTER_KEYS = ["query", "group_id", "subgroup", "status", "emis_status", "registered"] as const
export type StudentFilterKey = (typeof STUDENT_FILTER_KEYS)[number]

/** URL filters to the query of `GET /v1/admin/students` (without the cursor). */
export function studentParams(values: FilterValues<StudentFilterKey>): AdminStudentsParams {
  return {
    query: values.query ?? undefined,
    group_id: values.group_id ?? undefined,
    subgroup: values.subgroup === "1" ? 1 : values.subgroup === "2" ? 2 : undefined,
    status: studentStatusParam(values.status),
    emis_status: emisStatusParam(values.emis_status),
    registered: values.registered === "true" ? true : values.registered === "false" ? false : undefined,
  }
}
