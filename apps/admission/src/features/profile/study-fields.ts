import type { StudyGroup } from "../chooser/types"
import type { QuizAnswer } from "./details-api"

/** The key under which the chosen study fields (ids of `GET /catalog/study-fields`) live in the stored career quiz. */
export const STUDY_FIELDS_KEY = "study_fields"

/** Chosen study-field ids of the stored career quiz answers. */
export function readStudyFields(answers: Record<string, QuizAnswer> | undefined): string[] {
  const value = answers?.[STUDY_FIELDS_KEY]
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []
}

/** Adds the id, or removes it when it is already chosen. */
export function toggleStudyField(chosen: readonly string[], id: string): string[] {
  return chosen.includes(id) ? chosen.filter((entry) => entry !== id) : [...chosen, id]
}

/** The chosen fields as `{ id, label }` in the taxonomy's labels; an id the taxonomy lost keeps its id as label. */
export function chosenStudyFields(groups: StudyGroup[], chosen: readonly string[]): { id: string; label: string }[] {
  const labels = new Map(groups.flatMap((group) => group.items.map((item) => [item.id, item.label] as const)))
  return chosen.map((id) => ({ id, label: labels.get(id) ?? id }))
}

/** How many intended fields the profile has: the chosen study fields plus the majors added from the career results. */
export function intendedFieldCount(studyFields: readonly string[], careerMajors: readonly string[]): number {
  return studyFields.length + careerMajors.length
}
