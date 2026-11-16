import type { StepOption, StepQuestion, StepQuestionKind } from "../../components/stepper"
import { FIELD_ORDER, SECTION_OF, type PreferenceField } from "./mapping"

type Translate = (key: string) => string

type Fixed = { kind: StepQuestionKind; options: [value: string, emoji: string][] }

const PAIR = (yes: string, no: string): Fixed => ({
  kind: "boolean",
  options: [
    ["true", yes],
    ["false", no],
  ],
})

/** Option values of the fixed questions and their decoration; the labels are messages `prefs.o.<field>.<value>`. */
const FIXED: Partial<Record<PreferenceField, Fixed>> = {
  experience: {
    kind: "single",
    options: [
      ["academic", "🍎"],
      ["social", "🦋"],
      ["adventure", "⛰️"],
      ["holistic", "🏺"],
    ],
  },
  setting: {
    kind: "single",
    options: [
      ["rural", "🌲"],
      ["suburban", "🏘️"],
      ["city", "🏙️"],
    ],
  },
  distance: {
    kind: "select",
    options: [
      ["any", "🌍"],
      ["near", "🚗"],
      ["far", "✈️"],
    ],
  },
  small_classes: PAIR("🙋", "🏛️"),
  ec_important: PAIR("⚽", "📚"),
  food_important: PAIR("🍽️", "🥪"),
  prestige: PAIR("🏆", "🐮"),
  academics_first: PAIR("📖", "🎉"),
  need_aid: PAIR("🤲", "💪"),
  budget: {
    kind: "single",
    options: [
      ["under_10k", "🪙"],
      ["under_30k", "💵"],
      ["under_50k", "💰"],
      ["any", "♾️"],
    ],
  },
  cost_major: PAIR("💵", "🎓"),
}

export type QuestionSources = {
  /** Majors from the career taxonomy: `value` is the major code, `label` its localized name. */
  majors: { value: string; label: string }[]
  /** Regions from the catalog (countries). */
  regions: string[]
  /** Localized country name of a region code; unknown values come back as given. */
  regionName: (region: string) => string
}

/** The 13 questions in order. `t` is the translator of the `prefs` namespace. */
export function buildQuestions(t: Translate, sources: QuestionSources): StepQuestion[] {
  return FIELD_ORDER.map((field) => {
    const section = SECTION_OF[field]
    const base = {
      id: field,
      section,
      sectionLabel: t(`sections.${section}`),
      title: t(`q.${field}.title`),
      guide: t(`q.${field}.guide`),
    }
    const fixed = FIXED[field]
    if (fixed) {
      const options: StepOption[] = fixed.options.map(([value, emoji]) => ({
        value,
        emoji,
        label: t(`o.${field}.${value}`),
      }))
      return { ...base, kind: fixed.kind, options, placeholder: t("placeholder") }
    }
    if (field === "region") {
      const options: StepOption[] = [
        { value: "any", label: t("o.region.any") },
        ...sources.regions.map((region) => ({ value: region, label: sources.regionName(region) })),
      ]
      return { ...base, kind: "select" as const, options, placeholder: t("placeholder"), optional: true }
    }
    return { ...base, kind: "select" as const, options: sources.majors, placeholder: t("placeholder") }
  })
}

/** Display label of a tag key (`budget:under_10k`, `region:Uzbekistan`, `major:cs`, `prestige`). */
export function tagLabel(tag: string, t: Translate, sources: QuestionSources): string {
  const [head, rest] = tag.split(":", 2)
  if (head === "region" && rest && rest !== "any") return sources.regionName(rest)
  if (head === "major" && rest) {
    const found = sources.majors.find((major) => major.value.toLowerCase() === rest.toLowerCase())
    return found?.label ?? rest
  }
  return t(`tags.${tag.replaceAll(":", "_")}`)
}

/** Label of one stored answer, for the summary sentence. */
export function answerLabel(field: PreferenceField, value: string | null | undefined, questions: StepQuestion[]) {
  if (value === undefined || value === null) return undefined
  return questions.find((question) => question.id === field)?.options.find((option) => option.value === value)?.label
}
