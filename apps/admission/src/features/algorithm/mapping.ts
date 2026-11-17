import { firstUnanswered, type StepAnswers, type StepQuestion, type StepValue } from "../../components/stepper"
import type { AdmissionPreferenceAnswers as PreferenceAnswers } from "@ihsp/api"

/** Answers that are booleans in the contract; the stepper holds them as "true" / "false". */
export const BOOLEAN_FIELDS = [
  "small_classes",
  "ec_important",
  "food_important",
  "prestige",
  "academics_first",
  "need_aid",
  "cost_major",
] as const

/** Question ids are the contract field names, in questionnaire order. */
export const FIELD_ORDER = [
  "experience",
  "setting",
  "region",
  "distance",
  "small_classes",
  "ec_important",
  "food_important",
  "traits",
  "major",
  "prestige",
  "academics_first",
  "need_aid",
  "budget",
  "cost_major",
] as const

export type PreferenceField = (typeof FIELD_ORDER)[number]

export const SECTION_OF: Record<PreferenceField, "vibe" | "academics" | "financials"> = {
  experience: "vibe",
  setting: "vibe",
  region: "vibe",
  distance: "vibe",
  small_classes: "vibe",
  ec_important: "vibe",
  food_important: "vibe",
  traits: "vibe",
  major: "academics",
  prestige: "academics",
  academics_first: "academics",
  need_aid: "financials",
  budget: "financials",
  cost_major: "financials",
}

const isBooleanField = (field: string) => (BOOLEAN_FIELDS as readonly string[]).includes(field)

/** Questions the preferences contract has no field for; they are stored only with the quiz answers. */
export const QUIZ_ONLY_FIELDS: readonly string[] = ["traits"]

/** One answered question as the partial PUT body. */
export function answerToPayload(field: string, value: string | string[] | undefined): PreferenceAnswers {
  if (QUIZ_ONLY_FIELDS.includes(field)) return {}
  if (typeof value !== "string" || value === "") return field === "region" ? { region: null } : {}
  return { [field]: isBooleanField(field) ? value === "true" : value } as PreferenceAnswers
}

/** Stored answers as the stepper's string values. */
export function answersToValues(answers: PreferenceAnswers): StepAnswers {
  const values: StepAnswers = {}
  for (const [field, value] of Object.entries(answers)) {
    if (value === undefined || value === null) continue
    values[field] = typeof value === "boolean" ? String(value) : value
  }
  return values
}

/** Where to resume: the first unanswered question. */
export function resumeIndex(questions: StepQuestion[], answers: PreferenceAnswers): number {
  return firstUnanswered(questions, answersToValues(answers))
}

/** `region:Uzbekistan` → `region_Uzbekistan`: the message key of a tag. */
export const tagMessageKey = (tag: string) => tag.replaceAll(":", "_")

/** Saved quiz answers as the stepper's values; the preferences win where both hold a field. */
export function mergeValues(quiz: Record<string, unknown> | undefined, answers: PreferenceAnswers): StepAnswers {
  const values: StepAnswers = {}
  for (const [field, value] of Object.entries(quiz ?? {})) {
    if (typeof value === "string" || Array.isArray(value)) values[field] = value as StepValue
  }
  return { ...values, ...answersToValues(answers) }
}
