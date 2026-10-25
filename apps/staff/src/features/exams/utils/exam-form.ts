import type {
  AssessmentCreateBody,
  AssessmentKind,
  AssessmentPatchBody,
  ControlName,
  StaffAssessmentItem,
} from "@ihsp/api"
import { kindOfControl } from "./controls"
import { startsAtOf, timeOfStartsAt } from "./exam-time"

/** What the exam form edits; dates are `YYYY-MM-DD`, times `HH:MM` (Tashkent) and an empty text means "not set". */
export type ExamFormValues = {
  subjectId: string
  /** `""` is the whole group. */
  subgroup: "" | "1" | "2"
  kind: AssessmentKind
  /** `""` is no control week. */
  control: "" | ControlName
  date: string
  time: string
  room: string
  title: string
  note: string
}

const EMPTY: ExamFormValues = {
  subjectId: "",
  subgroup: "",
  kind: "midterm",
  control: "",
  date: "",
  time: "",
  room: "",
  title: "",
  note: "",
}

/** Empty values with some fields filled in, for "Add exam" and "Set date". */
export function formValues(prefill: Partial<ExamFormValues> = {}): ExamFormValues {
  return { ...EMPTY, ...prefill }
}

export function subgroupValue(subgroup: 1 | 2 | null | undefined): ExamFormValues["subgroup"] {
  return subgroup === 1 ? "1" : subgroup === 2 ? "2" : ""
}

/** The values of a stored control, for the edit form. A control week without a date has an empty date. */
export function valuesOfItem(item: StaffAssessmentItem): ExamFormValues {
  const only = item.audience.length === 1 ? item.audience[0] : undefined
  return {
    subjectId: item.subject.id,
    subgroup: subgroupValue(only?.subgroup),
    kind: item.kind,
    control: item.control ?? "",
    date: item.has_date ? item.date : "",
    time: timeOfStartsAt(item.starts_at),
    room: item.room ?? "",
    title: item.title,
    note: item.note ?? "",
  }
}

/** The kind and the control week must agree: a control week fixes the kind, `other` has no week. */
export function kindMatchesControl(kind: AssessmentKind, control: ExamFormValues["control"]): boolean {
  return control === "" ? true : kindOfControl(control) === kind
}

function subgroupNumber(subgroup: ExamFormValues["subgroup"]): 1 | 2 | null {
  return subgroup === "1" ? 1 : subgroup === "2" ? 2 : null
}

function blankToNull(text: string): string | null {
  const trimmed = text.trim()
  return trimmed === "" ? null : trimmed
}

/** `POST /v1/staff/assessments`: the group is the audience; empty optional fields are left out. */
export function toCreateBody(groupId: string, values: ExamFormValues): AssessmentCreateBody {
  const startsAt = startsAtOf(values.date, values.time)
  const title = values.title.trim()
  const room = blankToNull(values.room)
  const note = blankToNull(values.note)
  return {
    subject_id: values.subjectId,
    audience: [{ group_id: groupId, subgroup: subgroupNumber(values.subgroup) }],
    kind: values.kind,
    date: values.date,
    ...(title !== "" ? { title } : {}),
    ...(startsAt !== null ? { starts_at: startsAt } : {}),
    ...(room !== null ? { room } : {}),
    ...(note !== null ? { note } : {}),
    ...(values.control !== "" ? { control: values.control } : {}),
  }
}

/**
 * `PATCH /v1/staff/assessments/{id}`: only what changed. Cleared fields are sent as null; a new date also sends the
 * start time again (it is a moment on that day). Saving a control nobody confirmed yet confirms it, even unchanged.
 */
export function toPatchBody(
  item: Pick<StaffAssessmentItem, "audience" | "status">,
  initial: ExamFormValues,
  values: ExamFormValues,
): AssessmentPatchBody {
  const body: AssessmentPatchBody = {}
  const onlyGroup = item.audience.length === 1 ? item.audience[0] : undefined

  if (values.subjectId !== initial.subjectId) body.subject_id = values.subjectId
  if (values.subgroup !== initial.subgroup && onlyGroup) {
    body.audience = [{ group_id: onlyGroup.group_id, subgroup: subgroupNumber(values.subgroup) }]
  }
  if (values.kind !== initial.kind) body.kind = values.kind
  if (values.control !== initial.control) body.control = values.control === "" ? null : values.control
  if (values.date !== initial.date) body.date = values.date
  if (values.time !== initial.time || (values.date !== initial.date && values.time !== "")) {
    body.starts_at = startsAtOf(values.date, values.time)
  }
  if (values.room.trim() !== initial.room.trim()) body.room = blankToNull(values.room)
  if (values.title.trim() !== initial.title.trim()) body.title = values.title.trim()
  if (values.note.trim() !== initial.note.trim()) body.note = blankToNull(values.note)
  if (item.status === "tentative") body.status = "planned"
  return body
}

export function isEmptyPatch(body: AssessmentPatchBody): boolean {
  return Object.keys(body).length === 0
}
