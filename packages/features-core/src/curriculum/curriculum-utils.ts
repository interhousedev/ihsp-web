import type { CurriculumSubject, CurriculumView, LocalizedText } from "@ihsp/api"
import type { Locale } from "@ihsp/i18n"

/** Message key (`curriculum.types.<key>`) of each EMIS subject type id. */
export const SUBJECT_TYPE_KEYS = { 1: "general", 2: "inDepth", 3: "vocational", 4: "unified" } as const

export type SubjectTypeKey = (typeof SUBJECT_TYPE_KEYS)[keyof typeof SUBJECT_TYPE_KEYS]

/** `null` for a missing or unknown type id: no badge is shown. */
export function subjectTypeKey(typeId: number | null | undefined): SubjectTypeKey | null {
  if (typeId === 1 || typeId === 2 || typeId === 3 || typeId === 4) return SUBJECT_TYPE_KEYS[typeId]
  return null
}

/** The text in the interface language; an empty one falls back to uz, ru, en (the order of the API names). `""` when none is set. */
export function localizedText(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return ""
  for (const language of [locale, "uz", "ru", "en"] as const) {
    const value = text[language]?.trim()
    if (value) return value
  }
  return ""
}

/** The semester whose subjects are meant: the viewed one, else the current semester of the curriculum. */
export function curriculumSemester(curriculum: CurriculumView, viewed?: number | null): number | null {
  return viewed ?? curriculum.current_semester ?? curriculum.semesters.find((item) => item.is_current)?.number ?? null
}

export type CurriculumSubjectMatch = {
  /** Academic subject id of a subject card. */
  subjectId: string
  /** EMIS subject id, when the card has it: used when no curriculum subject is linked to the academic subject. */
  emisSubjectId?: number | null
}

/** The curriculum subject of a semester that belongs to a subject card: by `subject_id`, else by `emis_subject_id`. */
export function findCurriculumSubject(
  curriculum: CurriculumView | null | undefined,
  semester: number | null,
  match: CurriculumSubjectMatch,
): CurriculumSubject | null {
  const subjects = curriculum?.semesters.find((item) => item.number === semester)?.subjects ?? []
  const linked = subjects.find((item) => item.subject_id !== null && item.subject_id === match.subjectId)
  if (linked) return linked
  const emisId = match.emisSubjectId
  return emisId === null || emisId === undefined
    ? null
    : (subjects.find((item) => item.emis_subject_id === emisId) ?? null)
}

/** The language of a code like `RU` in the interface language (`Russian`); the code itself when the runtime does not know it. */
export function languageName(code: string, locale: Locale): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "language" }).of(code.trim().toLowerCase())
    if (name && name.toLowerCase() !== code.trim().toLowerCase()) return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    // an invalid language tag: show the code as it is
  }
  return code
}
