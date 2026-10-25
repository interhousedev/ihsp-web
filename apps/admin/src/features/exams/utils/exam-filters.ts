import type {
  AssessmentKind,
  AssessmentSource,
  AssessmentStatus,
  ControlName,
  ControlPeriods,
  StaffAssessmentItem,
  StaffAssessmentsParams,
} from "@ihsp/api"
import type { FilterValues } from "../../shared/hooks/use-filter-state"
import { CONTROL_NAMES } from "../../shared/utils/controls"

/** Every cached exams query (the list, the count to confirm); a change to an exam refetches them. */
export const EXAMS_QUERY_PREFIX = ["admin", "assessments"] as const

/** The filters of the exams list, kept in the URL. `undated` is `"true"` or missing. */
export const EXAM_FILTER_KEYS = [
  "from",
  "to",
  "group_id",
  "subject_id",
  "kind",
  "control",
  "status",
  "source",
  "undated",
] as const

export type ExamFilterKey = (typeof EXAM_FILTER_KEYS)[number]
export type ExamFilterValues = FilterValues<ExamFilterKey>

export const EXAM_KINDS: readonly AssessmentKind[] = ["midterm", "final", "other"]
export const EXAM_STATUSES: readonly AssessmentStatus[] = ["planned", "tentative", "cancelled"]
export const EXAM_SOURCES: readonly AssessmentSource[] = ["teacher", "admin", "emis", "head_student"]

function oneOf<T extends string>(allowed: readonly T[], value: string | null): T | undefined {
  return allowed.find((item) => item === value)
}

/** The control week named in the URL, if it is one of the three. */
export function selectedControl(value: string | null): ControlName | null {
  return CONTROL_NAMES.find((name) => name === value) ?? null
}

/**
 * The request for the filters in the URL. The API has no control-week filter, so a week asks for its dates (crossed
 * with the date range, the narrower limits win) and the rows are then narrowed with `inControl`. Choices the API does
 * not know are dropped. Without a status the API lists planned and not confirmed controls.
 */
export function examParams(values: ExamFilterValues, periods: ControlPeriods = {}): StaffAssessmentsParams {
  const control = selectedControl(values.control)
  const week = control ? periods[control] : null
  const from = [values.from, week?.start]
    .filter((date): date is string => Boolean(date))
    .toSorted()
    .at(-1)
  const to = [values.to, week?.end]
    .filter((date): date is string => Boolean(date))
    .toSorted()
    .at(0)
  return {
    from,
    to,
    group_id: values.group_id ?? undefined,
    subject_id: values.subject_id ?? undefined,
    kind: oneOf(EXAM_KINDS, values.kind),
    status: oneOf(EXAM_STATUSES, values.status),
    source: oneOf(EXAM_SOURCES, values.source),
    undated: values.undated === "true" ? true : undefined,
  }
}

/** Whether a row belongs to the chosen control week (`null`: every row). */
export function inControl(item: Pick<StaffAssessmentItem, "control">, control: ControlName | null): boolean {
  return control === null || item.control === control
}

/** By date (a week without a date stands at its first day), then by subject name. */
export function sortExams(items: readonly StaffAssessmentItem[]): StaffAssessmentItem[] {
  return items.toSorted(
    (a, b) => a.date.localeCompare(b.date) || a.subject.name.localeCompare(b.subject.name) || a.id.localeCompare(b.id),
  )
}
