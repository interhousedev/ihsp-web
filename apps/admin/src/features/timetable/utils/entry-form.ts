import type { TimetableEntry, TimetableEntryInput } from "@ihsp/api"
import type { AudienceChoice } from "../../shared/components/audience-picker"

export type EntryForm = {
  weekday: number
  period: number
  week_parity: "every" | "odd" | "even"
  subject_id: string
  teacher_id: string
  room_name: string
  audience: AudienceChoice[]
  valid_from: string | null
  valid_to: string | null
}

export function newEntryForm(
  defaults: Partial<EntryForm> & { weekday: number; period: number; valid_from: string | null },
): EntryForm {
  return {
    week_parity: "every",
    subject_id: "",
    teacher_id: "",
    room_name: "",
    audience: [],
    valid_to: null,
    ...defaults,
  }
}

export function entryToForm(entry: TimetableEntry): EntryForm {
  return {
    weekday: entry.weekday,
    period: entry.period,
    week_parity: entry.week_parity,
    subject_id: entry.subject.id,
    teacher_id: entry.teacher?.id ?? "",
    room_name: entry.room?.name ?? "",
    audience: entry.audience.map((item) => ({ group_id: item.group_id, subgroup: item.subgroup })),
    valid_from: entry.valid_from,
    valid_to: entry.valid_to,
  }
}

/** The request body, or null while a required field (subject, audience, start date) is still empty. */
export function entryInput(termId: string, form: EntryForm): TimetableEntryInput | null {
  if (form.subject_id === "" || form.audience.length === 0 || form.valid_from === null) return null
  if (form.valid_to !== null && form.valid_to < form.valid_from) return null
  return {
    term_id: termId,
    weekday: form.weekday,
    period: form.period,
    week_parity: form.week_parity,
    subject_id: form.subject_id,
    teacher_id: form.teacher_id === "" ? null : form.teacher_id,
    room_name: form.room_name.trim() === "" ? null : form.room_name.trim(),
    audience: [...form.audience].toSorted(
      (a, b) => a.group_id.localeCompare(b.group_id) || (a.subgroup ?? 0) - (b.subgroup ?? 0),
    ),
    valid_from: form.valid_from,
    valid_to: form.valid_to,
  }
}

/** True when the only audience is one whole group (the case where a divisible subject should be split). */
export function isWholeGroupOnly(audience: readonly AudienceChoice[]): audience is [AudienceChoice] {
  return audience.length === 1 && audience[0]?.subgroup === null
}
