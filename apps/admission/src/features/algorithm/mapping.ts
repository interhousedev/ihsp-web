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

/** Questions answered with several chips; the contract holds lists (`[]` = no preference / anywhere). */
export const LIST_FIELDS: readonly string[] = ["setting", "region"]

/** The chip that stands for the empty list. */
export const ANY = "any"

const MAX_SETTINGS = 3

/** One answered question as the partial PUT body. */
export function answerToPayload(field: string, value: string | string[] | undefined): PreferenceAnswers {
  if (QUIZ_ONLY_FIELDS.includes(field)) return {}
  if (LIST_FIELDS.includes(field)) {
    if (value === undefined || value === "") return field === "region" ? { region: null } : {}
    const picked = (Array.isArray(value) ? value : [value]).filter((item) => item !== "" && item !== ANY)
    if (field === "region") {
      const codes = [...new Set(picked.map((code) => code.toUpperCase()).filter((code) => /^[A-Z]{2}$/.test(code)))]
      return { region: codes }
    }
    return { setting: [...new Set(picked)].slice(0, MAX_SETTINGS) } as PreferenceAnswers
  }
  if (typeof value !== "string" || value === "") return {}
  return { [field]: isBooleanField(field) ? value === "true" : value } as PreferenceAnswers
}

/** Stored answers as the stepper's string values. */
export function answersToValues(answers: PreferenceAnswers): StepAnswers {
  const values: StepAnswers = {}
  for (const [field, value] of Object.entries(answers)) {
    if (value === undefined || value === null) continue
    values[field] = toStepValue(field, value)
  }
  return values
}

/** A stored value as the stepper's: lists stay lists (`[]` is the "any" chip), legacy single values become lists. */
function toStepValue(field: string, value: unknown): StepValue {
  if (typeof value === "boolean") return String(value)
  if (LIST_FIELDS.includes(field)) {
    const list = Array.isArray(value) ? (value as string[]) : typeof value === "string" ? [value] : []
    const picked = list.filter((item) => item !== "" && item !== ANY)
    return picked.length > 0 ? picked : [ANY]
  }
  return value as StepValue
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
    if (typeof value === "string" || Array.isArray(value)) values[field] = toStepValue(field, value)
  }
  return { ...values, ...answersToValues(answers) }
}
