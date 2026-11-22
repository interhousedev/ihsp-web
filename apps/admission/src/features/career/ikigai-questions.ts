// The ikigai half of the questionnaire: chips plus an optional short text per question. Texts live in messages
// (`career.ikigaiQ.<id>.*`); the answers are stored in the career quiz under `ik_<id>` / `ik_<id>_text` and map
// deterministically to the four ikigai circles (love / good at / world needs / paid for).

import { EMPTY_IKIGAI, MAX_CHIP_LENGTH, MAX_CHIPS } from "../professions/model"
import type { Ikigai, IkigaiCircle } from "../professions/api"

export type IkigaiQuestion = {
  id: string
  /** The circle the chips fill; `null` is a stored view (shown to counsellors) that adds no chips. */
  circle: IkigaiCircle | null
  kind: "single" | "multi"
  options: readonly string[]
  /** Most picks of a multi question. */
  max?: number
  /** True when the question has a free-text line next to the chips. */
  text?: boolean
}

export const IKIGAI_QUESTIONS: readonly IkigaiQuestion[] = [
  {
    id: "flow",
    circle: "love",
    kind: "multi",
    max: 4,
    text: true,
    options: ["build", "puzzle", "explain", "design", "write", "experiment", "organize", "perform", "care", "analyze"],
  },
  {
    id: "topics",
    circle: "love",
    kind: "multi",
    max: 4,
    text: true,
    options: ["tech", "space", "health", "money", "nature", "history", "languages", "games", "art", "society"],
  },
  {
    id: "values",
    circle: "love",
    kind: "multi",
    max: 3,
    options: ["freedom", "helping", "creativity", "status", "learning", "stability", "adventure", "fairness"],
  },
  {
    id: "strengths",
    circle: "good_at",
    kind: "multi",
    max: 4,
    text: true,
    options: [
      "explain",
      "logic",
      "calm",
      "creative",
      "lead",
      "languages",
      "listen",
      "detail",
      "learnfast",
      "techskill",
    ],
  },
  {
    id: "people",
    circle: "needs",
    kind: "multi",
    max: 3,
    text: true,
    options: ["kids", "patients", "entrepreneurs", "teams", "community", "youth", "customers", "experts"],
  },
  {
    id: "problems",
    circle: "needs",
    kind: "multi",
    max: 4,
    text: true,
    options: [
      "education",
      "health",
      "jobs",
      "environment",
      "digital",
      "agriculture",
      "energy",
      "safety",
      "poverty",
      "tourism",
    ],
  },
  { id: "aiview", circle: null, kind: "single", options: ["tool", "half", "vanish", "newjobs"] },
  {
    id: "airole",
    circle: "paid",
    kind: "multi",
    max: 2,
    text: true,
    options: ["build", "use", "human", "check", "law"],
  },
  { id: "money", circle: "paid", kind: "multi", max: 2, options: ["stable", "high", "business", "meaning", "abroad"] },
  {
    id: "setting",
    circle: "paid",
    kind: "multi",
    max: 3,
    text: true,
    options: ["office", "remote", "lab", "field", "hospital", "school", "startup", "public"],
  },
]

export const ikigaiKey = (id: string) => `ik_${id}`
export const ikigaiTextKey = (id: string) => `ik_${id}_text`

type Stored = Readonly<Record<string, string | number | boolean | string[] | undefined>>

const asList = (value: Stored[string]): string[] =>
  Array.isArray(value) ? value : typeof value === "string" && value !== "" ? [value] : []

/** Free text as chips: split on commas, semicolons and line breaks, trimmed, cut to the chip length. */
export function textChips(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((part) => part.trim().slice(0, MAX_CHIP_LENGTH).trim())
    .filter((part) => part !== "")
}

const sameChip = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** The distinct chips, first spelling kept, at most `MAX_CHIPS`. */
function distinct(chips: readonly string[]): string[] {
  const out: string[] = []
  for (const chip of chips) if (!out.some((seen) => sameChip(seen, chip))) out.push(chip)
  return out.slice(0, MAX_CHIPS)
}

/**
 * The ikigai the answers imply. Each question gives its own typed words first, then its picked chips (`label` is the
 * localized chip text); the questions of one circle are interleaved so that none crowds the others out of the cap.
 */
export function deriveIkigai(answers: Stored, label: (questionId: string, option: string) => string): Ikigai {
  const lists: Record<IkigaiCircle, string[][]> = { love: [], good_at: [], needs: [], paid: [] }
  for (const question of IKIGAI_QUESTIONS) {
    if (!question.circle) continue
    const picked = asList(answers[ikigaiKey(question.id)]).filter((option) => question.options.includes(option))
    const typed = textChips(
      typeof answers[ikigaiTextKey(question.id)] === "string" ? String(answers[ikigaiTextKey(question.id)]) : "",
    )
    lists[question.circle].push([...typed, ...picked.map((option) => label(question.id, option))])
  }
  const out: Ikigai = { ...EMPTY_IKIGAI }
  for (const circle of Object.keys(lists) as IkigaiCircle[]) {
    const rows = lists[circle]
    const mixed: string[] = []
    for (let i = 0; rows.some((row) => i < row.length); i++)
      for (const row of rows) if (i < row.length) mixed.push(row[i]!)
    out[circle] = distinct(mixed)
  }
  return out
}

/** The student's own chips stay; the questionnaire's are added after them (no duplicates, at most `MAX_CHIPS`). */
export function mergeIkigai(existing: Ikigai, derived: Ikigai): Ikigai {
  const out: Ikigai = { ...EMPTY_IKIGAI }
  for (const circle of Object.keys(out) as IkigaiCircle[])
    out[circle] = distinct([...existing[circle], ...derived[circle]])
  return out
}

/** The questionnaire is considered started once any ikigai answer is stored. */
export const hasIkigaiAnswers = (answers: Stored) =>
  IKIGAI_QUESTIONS.some((q) => asList(answers[ikigaiKey(q.id)]).length > 0)
