import type { AssessmentStatus, StaffAssessmentItem } from "@ihsp/api"

/** What a row shows as its status: a control week with no date is "undated", whatever its stored status. */
export type ExamStatus = AssessmentStatus | "undated"

export function examStatus(item: Pick<StaffAssessmentItem, "has_date" | "status">): ExamStatus {
  return item.has_date ? item.status : "undated"
}
