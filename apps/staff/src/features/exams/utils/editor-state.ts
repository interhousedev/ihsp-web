import type { StaffAssessmentItem } from "@ihsp/api"
import { subgroupValue, type ExamFormValues } from "./exam-form"

/** What the editor dialog is doing: a new exam, a date for a control week, or a stored control (or suggestion). */
export type EditorState =
  | { mode: "add"; prefill: Partial<ExamFormValues> }
  | { mode: "setDate"; prefill: Partial<ExamFormValues> }
  | { mode: "edit"; item: StaffAssessmentItem }

/** "Set date" on a control week without a date: the same subject, kind, control week and subgroup, no date yet. */
export function setDatePrefill(item: StaffAssessmentItem): Partial<ExamFormValues> {
  const only = item.audience.length === 1 ? item.audience[0] : undefined
  return {
    subjectId: item.subject.id,
    subgroup: subgroupValue(only?.subgroup),
    kind: item.kind,
    control: item.control ?? "",
  }
}
