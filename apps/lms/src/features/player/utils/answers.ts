import type { Answer } from "@ihsp/api"

export type AttemptQuestion = {
  id: string
  type: string
  prompt: string
  points: number
  options?: { id: string; text: string }[] | null
  lefts?: { id: string; text: string }[] | null
  rights?: { id: string; text: string }[] | null
  table?: { rows: string[]; columns: string[] } | null
  blanks?: number | null
  variables?: string[] | null
  code?: { language: string; starter: string; auto: boolean } | null
}

/** True when the answer holds something to grade (empty answers are not sent). */
export function isAnswered(answer: Answer | undefined): boolean {
  if (!answer) return false
  if (answer.option_ids !== undefined) return answer.option_ids.length > 0
  if (answer.pairs !== undefined) return Object.keys(answer.pairs).length > 0
  if (answer.cells !== undefined) return answer.cells.length > 0
  if (answer.texts !== undefined) return answer.texts.some((text) => text.trim() !== "")
  if (answer.output !== undefined && (answer.text === undefined || answer.text.trim() === ""))
    return answer.output.trim() !== ""
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
    if ("pairs" in record && record.pairs && typeof record.pairs === "object") {
      const lefts = new Map(question?.lefts?.map((item) => [item.id, item.text]))
      const rights = new Map(question?.rights?.map((item) => [item.id, item.text]))
      return Object.entries(record.pairs as Record<string, string>)
        .map(([left, right]) => `${lefts.get(left) ?? left} - ${rights.get(right) ?? right}`)
        .join("; ")
    }
    if ("cells" in record && Array.isArray(record.cells)) {
      const rows = question?.table?.rows ?? []
      const columns = question?.table?.columns ?? []
      return record.cells
        .map((cell) => {
          const [row, column] = String(cell).split(":").map(Number)
          return `${rows[row ?? -1] ?? row} / ${columns[column ?? -1] ?? column}`
        })
        .join("; ")
    }
    if ("texts" in record && Array.isArray(record.texts)) return record.texts.join(", ")
    if ("output" in record) return describeValue(question, record.output)
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
  if (answer.pairs || answer.cells || answer.texts) return describeValue(question, answer)
  if (question?.type === "code") return answer.output ?? answer.text ?? ""
  return describeValue(question, answer.option_ids ?? answer.text ?? answer.number)
}
