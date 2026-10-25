import type {
  AssessmentCreateBody,
  AssessmentKind,
  AssessmentPatchBody,
  ControlName,
  StaffAssessmentItem,
} from "@ihsp/api"
import { isoToTashkentLocal, tashkentLocalToIso } from "../../broadcasts/utils/broadcast-form"
import type { AudienceChoice } from "../../shared/components/audience-picker"
import { controlKind, kindFitsControl } from "../../shared/utils/controls"

/** An exam while it is edited. `time` is `HH:mm` in Tashkent or empty. */
export type ExamForm = {
  subject_id: string
  audience: AudienceChoice[]
  kind: AssessmentKind
  control: ControlName | null
  date: string | null
  time: string
  room: string
  title: string
  note: string
}

export type ExamIssue = "subject" | "audience" | "date" | "time"

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function emptyExamForm(): ExamForm {
  return {
    subject_id: "",
    audience: [],
    kind: "midterm",
    control: null,
    date: null,
    time: "",
    room: "",
    title: "",
    note: "",
  }
}

function audienceOf(item: StaffAssessmentItem): AudienceChoice[] {
  return item.audience.map(({ group_id, subgroup }) => ({ group_id, subgroup }))
}

/** The time of day (Tashkent) of an instant, `HH:mm`. */
function timeOf(iso: string | null): string {
  return iso ? isoToTashkentLocal(iso).slice(11, 16) : ""
}

/** An exam as the edit dialog starts. */
export function examToForm(item: StaffAssessmentItem): ExamForm {
  return {
    subject_id: item.subject.id,
    audience: audienceOf(item),
    kind: item.kind,
    control: item.control,
    date: item.date,
    time: timeOf(item.starts_at),
    room: item.room ?? "",
    title: item.title,
    note: item.note ?? "",
  }
}

/** A control week without a date: the subject, group, kind and week are given, the date is to be chosen. */
export function setDateForm(item: StaffAssessmentItem): ExamForm {
  return { ...examToForm(item), date: null, time: "", room: "", title: "", note: "" }
}

/** Another kind; a control week that is not for it is dropped. */
export function withKind(form: ExamForm, kind: AssessmentKind): ExamForm {
  return { ...form, kind, control: kindFitsControl(kind, form.control) ? form.control : null }
}

/** Another control week; the kind follows it (a week is for one kind). */
export function withControl(form: ExamForm, control: ControlName | null): ExamForm {
  return { ...form, control, kind: control ? controlKind(control) : form.kind }
}

/** What stops the form from being saved. */
export function validateExam(form: ExamForm): ExamIssue[] {
  const issues: ExamIssue[] = []
  if (form.subject_id === "") issues.push("subject")
  if (form.audience.length === 0) issues.push("audience")
  if (form.date === null) issues.push("date")
  if (form.time !== "" && !TIME_PATTERN.test(form.time)) issues.push("time")
  return issues
}

function startsAt(date: string | null, time: string): string | null {
  return date && time ? tashkentLocalToIso(`${date}T${time}`) : null
}

function optionalText(text: string): string | undefined {
  const trimmed = text.trim()
  return trimmed === "" ? undefined : trimmed
}

/** The body of a new exam; only call it when `validateExam` found nothing. Empty fields are left out. */
export function examCreateBody(form: ExamForm): AssessmentCreateBody {
  const body: AssessmentCreateBody = {
    subject_id: form.subject_id,
    audience: form.audience,
    kind: form.kind,
    date: form.date ?? "",
  }
  const title = optionalText(form.title)
  const room = optionalText(form.room)
  const note = optionalText(form.note)
  const start = startsAt(form.date, form.time)
  if (title) body.title = title
  if (start) body.starts_at = start
  if (room) body.room = room
  if (note) body.note = note
  if (form.control) body.control = form.control
  return body
}

function audienceKey(choices: readonly AudienceChoice[]): string {
  return choices
    .map(({ group_id, subgroup }) => `${group_id}:${subgroup ?? 0}`)
    .toSorted()
    .join(",")
}

/**
 * Only what differs from `original`; an emptied room, note or time is `null` (clears it). A new date alone leaves the
 * start time out: the server moves it to the new day. Nothing differs: `{}`.
 */
export function examPatchBody(form: ExamForm, original: StaffAssessmentItem): AssessmentPatchBody {
  const before = examToForm(original)
  const body: AssessmentPatchBody = {}
  if (form.kind !== before.kind) body.kind = form.kind
  if (form.control !== before.control) body.control = form.control
  if (form.date !== before.date && form.date) body.date = form.date
  if (form.time !== before.time) body.starts_at = startsAt(form.date, form.time)
  if (form.title.trim() !== before.title.trim()) body.title = form.title.trim()
  if (form.room.trim() !== before.room.trim()) body.room = optionalText(form.room) ?? null
  if (form.note.trim() !== before.note.trim()) body.note = optionalText(form.note) ?? null
  if (audienceKey(form.audience) !== audienceKey(before.audience)) body.audience = form.audience
  return body
}
