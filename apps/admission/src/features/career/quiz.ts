// The single-choice career quiz: question and option texts live in messages (`career.quiz.<id>.*`), the weights here.
// Each option votes for majors of the backend taxonomy (codes of `/v1/admission/career/majors`).

export type QuizOption = { key: string; majors: readonly string[] }
export type QuizQuestion = { id: string; options: readonly QuizOption[]; kind?: "track" }

const o = (key: string, ...majors: string[]): QuizOption => ({ key, majors })

export const QUIZ: readonly QuizQuestion[] = [
  {
    id: "q1",
    options: [
      o("a", "computer_science", "data_science", "electrical_engineering"),
      o("b", "mechanical_engineering", "civil_engineering", "physics"),
      o("c", "biology", "chemistry", "public_health"),
      o("d", "history", "philosophy", "linguistics", "psychology"),
    ],
  },
  {
    id: "q2",
    options: [
      o("a", "computer_science", "mathematics", "data_science"),
      o("b", "mechanical_engineering", "electrical_engineering", "architecture"),
      o("c", "biology", "chemistry", "physics", "medicine"),
      o("d", "philosophy", "linguistics", "history", "law"),
    ],
  },
  {
    id: "q3",
    options: [
      o("a", "business", "economics", "finance", "international_relations"),
      o("b", "psychology", "linguistics", "history"),
      o("c", "medicine", "public_health", "psychology"),
      o("d", "design", "architecture", "music"),
    ],
  },
  {
    id: "q4",
    options: [
      o("a", "computer_science", "data_science", "electrical_engineering"),
      o("b", "mechanical_engineering", "civil_engineering", "architecture", "design"),
      o("c", "design", "music", "linguistics"),
      o("d", "psychology", "political_science", "history", "economics"),
    ],
  },
  {
    id: "q5",
    options: [
      o("a", "business", "finance", "economics", "computer_science"),
      o("b", "linguistics", "psychology", "history"),
      o("c", "medicine", "public_health", "biology"),
      o("d", "design", "music", "architecture"),
    ],
  },
  {
    id: "q6",
    options: [
      o("a", "data_science", "physics", "chemistry", "biology", "mathematics"),
      o("b", "linguistics", "law", "history", "philosophy"),
      o("c", "business", "finance", "civil_engineering", "economics"),
      o("d", "political_science", "law", "international_relations", "public_health"),
    ],
  },
  {
    id: "q7",
    options: [
      o("a", "psychology", "linguistics", "public_health"),
      o("b", "medicine", "public_health", "biology"),
      o("c", "philosophy", "history", "linguistics"),
      o("d", "political_science", "law", "economics", "international_relations"),
    ],
  },
  {
    id: "q8",
    kind: "track",
    options: [
      o("a", "computer_science", "data_science", "electrical_engineering", "mathematics"),
      o("b", "biology", "chemistry", "physics", "medicine"),
      o("c", "business", "economics", "finance", "international_relations"),
    ],
  },
  {
    id: "q9",
    options: [
      o("a", "biology", "chemistry", "medicine"),
      o("b", "civil_engineering", "mechanical_engineering", "physics"),
      o("c", "computer_science", "data_science", "mathematics"),
      o("d", "psychology", "political_science", "history", "economics"),
    ],
  },
  {
    id: "q10",
    options: [
      o("a", "medicine", "biology", "psychology"),
      o("b", "business", "finance", "law", "international_relations"),
      o("c", "design", "architecture", "music", "linguistics"),
      o("d", "mathematics", "physics", "data_science", "computer_science"),
    ],
  },
]

export type Recommendation = {
  code: string
  score: number
  /** `[questionId, optionKey]` of the answers that voted for the major. */
  because: readonly (readonly [string, string])[]
}

/** The best majors for the answers, restricted to `available` codes; at most `limit`, never an empty-score major. */
export function recommend(
  answers: Readonly<Record<string, string>>,
  available: readonly string[],
  limit = 3,
): Recommendation[] {
  const ok = new Set(available)
  const scores = new Map<string, Recommendation & { because: [string, string][] }>()
  for (const question of QUIZ) {
    const chosen = question.options.find((option) => option.key === answers[question.id])
    for (const code of chosen?.majors ?? []) {
      if (!ok.has(code)) continue
      const entry = scores.get(code) ?? { code, score: 0, because: [] }
      entry.score += 1
      entry.because.push([question.id, chosen!.key])
      scores.set(code, entry)
    }
  }
  const order = new Map(available.map((code, index) => [code, index]))
  return [...scores.values()]
    .sort((a, b) => b.score - a.score || (order.get(a.code) ?? 0) - (order.get(b.code) ?? 0))
    .slice(0, limit)
}
