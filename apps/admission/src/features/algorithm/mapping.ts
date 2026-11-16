import { firstUnanswered, type StepAnswers, type StepQuestion } from "../../components/stepper"
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
  major: "academics",
  prestige: "academics",
  academics_first: "academics",
  need_aid: "financials",
  budget: "financials",
  cost_major: "financials",
}

const isBooleanField = (field: string) => (BOOLEAN_FIELDS as readonly string[]).includes(field)

/** One answered question as the partial PUT body. */
export function answerToPayload(field: string, value: string | string[] | undefined): PreferenceAnswers {
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
