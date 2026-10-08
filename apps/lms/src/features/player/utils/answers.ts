import type { Answer } from "@ihsp/api"

export type AttemptQuestion = {
  id: string
  type: string
  prompt: string
  points: number
  options?: { id: string; text: string }[] | null
}

/** True when the answer holds something to grade (empty answers are not sent). */
export function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  if (answer.option_ids !== undefined) return answer.option_ids.length > 0
  if (answer.text !== undefined) return answer.text.trim() !== ""
  return answer.number !== undefined && Number.isFinite(answer.number)
}

/** Sets or clears one question's answer without mutating the map. */
export function withAnswer(
  answers: Record<string, Answer>,
  questionId: string,
  answer: Answer | null,
): Record<string, Answer> {
  const next = { ...answers }
  if (answer === null || !isAnswered(answer)) delete next[questionId]
  else next[questionId] = answer
  return next
}

/** A value from the grading review (option ids, text, number) as readable text. */
export function describeValue(question: AttemptQuestion | undefined, value: unknown): string {
  const optionText = (id: unknown) => question?.options?.find((option) => option.id === id)?.text
  if (Array.isArray(value)) return value.map((item) => describeValue(question, item)).join(", ")
  if (typeof value === "string") return optionText(value) ?? value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value === null || value === undefined) return ""
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    if ("option_ids" in record) return describeValue(question, record.option_ids)
    if ("text" in record) return describeValue(question, record.text)
    if ("number" in record) return describeValue(question, record.number)
    if ("accepted" in record) return describeValue(question, record.accepted)
    if ("value" in record) return describeValue(question, record.value)
    return JSON.stringify(value)
  }
  return String(value)
}

export function describeAnswer(question: AttemptQuestion | undefined, answer: Answer | undefined): string {
  if (!answer) return ""
  return describeValue(question, answer.option_ids ?? answer.text ?? answer.number)
}
