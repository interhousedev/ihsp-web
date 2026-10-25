import type { ExerciseContent, ExerciseQuestion } from "@ihsp/api"

/**
 * The answer of one question: an option id (single choice, T/F/NG), option ids (multiple choice), item id → option id
 * (matching) or text (gap fill, short answer, essay).
 */
export type ExerciseAnswer = string | string[] | Record<string, string>
export type ExerciseAnswers = Record<string, ExerciseAnswer>

export type QuestionGrade = { earned: number; possible: number }

const EDGE_CHAR = /[\s"'«»“”‘’.,;:!?()[\]-]/
const WORD = /[\p{L}\p{N}'’-]+/gu

/** Strips edge whitespace and punctuation by a linear scan: a regex with `+$` backtracks on long runs. */
function stripEdges(text: string): string {
  let start = 0
  let end = text.length
  while (start < end && EDGE_CHAR.test(text.charAt(start))) start++
  while (end > start && EDGE_CHAR.test(text.charAt(end - 1))) end--
  return text.slice(start, end)
}

/** Case-, whitespace- and edge-punctuation-insensitive form of a typed answer (as the backend's `normalize_answer`). */
export function normalizeAnswer(text: string): string {
  return stripEdges(text.toLocaleLowerCase().replaceAll(/\s+/g, " ").trim())
}

/** Words of a text; numbers count as words, as in IELTS. */
export function wordCount(text: string): number {
  return text.match(WORD)?.length ?? 0
}

/** True when a typed answer respects the word limit (0 = no limit). */
export function withinLimit(text: string, limit: number): boolean {
  return limit <= 0 || wordCount(text) <= limit
}

function textMatches(answer: string, question: ExerciseQuestion): boolean {
  const key = normalizeAnswer(answer)
  if (key === "" || !withinLimit(answer, question.word_limit)) return false
  return question.accepted.some((accepted) => normalizeAnswer(accepted) === key)
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000")
}

/** Points of one question; an essay has none (it is assessed against the rubric, optionally by AI). */
export function gradeQuestion(question: ExerciseQuestion, answer: ExerciseAnswer | undefined): QuestionGrade {
  switch (question.type) {
    case "free_response":
      return { earned: 0, possible: 0 }
    case "matching": {
      const given = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}
      const earned = question.items.filter((item) => given[item.id] === item.answer).length
      return { earned, possible: question.items.length }
    }
    case "gap_fill":
    case "short_answer":
      return { earned: typeof answer === "string" && textMatches(answer, question) ? 1 : 0, possible: 1 }
    case "multiple_choice":
      return { earned: Array.isArray(answer) && sameSet(answer, question.correct) ? 1 : 0, possible: 1 }
    default:
      return { earned: typeof answer === "string" && question.correct.includes(answer) ? 1 : 0, possible: 1 }
  }
}

/** The score of the objective questions of the whole exercise. */
export function gradeExercise(content: ExerciseContent, answers: ExerciseAnswers): QuestionGrade {
  let earned = 0
  let possible = 0
  for (const section of content.sections) {
    for (const question of section.questions) {
      const grade = gradeQuestion(question, answers[question.id])
      earned += grade.earned
      possible += grade.possible
    }
  }
  return { earned, possible }
}

/** The saved progress of an exercise, read defensively (it is whatever the browser stored before). */
export type ExerciseProgress = { answers: ExerciseAnswers; submitted: boolean }

export function readProgress(state: unknown): ExerciseProgress {
  if (!state || typeof state !== "object") return { answers: {}, submitted: false }
  const raw = state as { answers?: unknown; submitted?: unknown }
  const answers = raw.answers && typeof raw.answers === "object" ? (raw.answers as ExerciseAnswers) : {}
  return { answers, submitted: raw.submitted === true }
}
