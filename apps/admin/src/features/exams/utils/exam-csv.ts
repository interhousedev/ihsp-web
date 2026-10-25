import type { AssessmentKind, AssessmentSource, ControlName, StaffAssessmentItem } from "@ihsp/api"
import type { CsvCell } from "../../shared/utils/csv"
import { audienceLabel, fullName } from "../../shared/utils/names"
import { examStatus, type ExamStatus } from "./exam-status"

/** The words of the export, so the file follows the language of the page. */
export type ExamCsvText = {
  header: readonly string[]
  kind: (kind: AssessmentKind) => string
  control: (name: ControlName) => string
  status: (status: ExamStatus) => string
  source: (source: AssessmentSource) => string
  /** `starts_at` (an instant) as the time of day. */
  time: (iso: string) => string
}

/** The exams as CSV rows (ADM-16): dates as `YYYY-MM-DD`, a week without a date as its first and last day. */
export function examCsvRows(items: readonly StaffAssessmentItem[], text: ExamCsvText): CsvCell[][] {
  return [
    [...text.header],
    ...items.map((item): CsvCell[] => [
      item.has_date ? item.date : "",
      !item.has_date && item.period ? `${item.period.start} – ${item.period.end}` : "",
      item.subject.name,
      audienceLabel(item.audience),
      text.kind(item.kind),
      item.control ? text.control(item.control) : "",
      item.starts_at ? text.time(item.starts_at) : "",
      item.room,
      text.status(examStatus(item)),
      text.source(item.source),
      fullName(item.created_by),
      item.title,
      item.note,
    ]),
  ]
}
