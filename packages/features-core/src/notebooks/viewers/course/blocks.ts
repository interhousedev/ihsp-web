import type { Block, DraftBlock } from "@ihsp/api"

/** One answer option of a question as the preview shows it. */
export type DisplayOption = { text: string; correct: boolean }

export type DisplayQuestion = {
  type: "single" | "multiple" | "text" | "number"
  prompt: string
  explanation: string | null
  options: DisplayOption[]
  /** Text and number questions: the accepted answers in words (`3.5 ± 0.1`, `regex: ...`). */
  answers: string[]
}

/** A block of a lesson draft or of a step in the course draft, reduced to what the preview needs. */
export type DisplayBlock =
  | { type: "text"; markdown: string }
  | { type: "test"; questions: DisplayQuestion[]; passingScore: number | null }
  | { type: "flashcards"; cards: { front: string; back: string }[] }

function numberAnswer(value: number | null | undefined, tolerance: number | undefined): string[] {
  if (value === null || value === undefined) return []
  return [tolerance ? `${value} ± ${tolerance}` : String(value)]
}

function fromDraft(block: DraftBlock): DisplayBlock {
  if (block.type === "text") return { type: "text", markdown: block.markdown }
  if (block.type === "flashcards")
    return { type: "flashcards", cards: block.cards.map(({ front, back }) => ({ front, back })) }
  return {
    type: "test",
    passingScore: block.settings?.passing_score_pct ?? null,
    questions: block.questions.map((question) => ({
      type: question.type,
      prompt: question.prompt,
      explanation: question.explanation ?? null,
      options: (question.options ?? []).map(({ text, correct }) => ({ text, correct })),
      answers: [
        ...(question.accepted_answers ?? []),
        ...(question.regex ? [`/${question.regex}/`] : []),
        ...numberAnswer(question.number, question.tolerance),
      ],
    })),
  }
}

function fromLms(block: Block): DisplayBlock {
  if (block.type === "text") return { type: "text", markdown: block.markdown }
  if (block.type === "flashcards")
    return { type: "flashcards", cards: block.cards.map(({ front, back }) => ({ front, back })) }
  return {
    type: "test",
    passingScore: block.config.passing_score_pct,
    questions: block.questions.map((question) => ({
      type: question.type,
      prompt: question.prompt,
      explanation: question.explanation,
      options: (question.options ?? []).map(({ text, correct }) => ({ text, correct })),
      answers: [
        ...(question.answer?.accepted ?? []),
        ...(question.answer?.regex ? [`/${question.answer.regex}/`] : []),
        ...numberAnswer(question.answer?.value, question.answer?.tolerance),
      ],
    })),
  }
}

/** Blocks of the model's lesson draft (no ids) or of an LMS step (with ids) in one shape. */
export function toDisplayBlocks(blocks: readonly (DraftBlock | Block)[]): DisplayBlock[] {
  return blocks.map((block) => ("id" in block ? fromLms(block) : fromDraft(block)))
}

/** The text of a block for the line diff: Markdown as it is, cards and questions as short lines. */
export function blockText(block: DisplayBlock): string {
  if (block.type === "text") return block.markdown
  if (block.type === "flashcards") return block.cards.map((card) => `${card.front} → ${card.back}`).join("\n")
  return block.questions.map((question) => question.prompt).join("\n")
}

export type DiffLine = { kind: "same" | "added" | "removed"; text: string }

/** Line diff of two texts (longest common subsequence); enough for a step that is a few screens long. */
export function lineDiff(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : before.split("\n")
  const b = after === "" ? [] : after.split("\n")
  const table: number[][] = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: "same", text: a[i]! })
      i++
      j++
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      lines.push({ kind: "removed", text: a[i++]! })
    } else {
      lines.push({ kind: "added", text: b[j++]! })
    }
  }
  while (i < a.length) lines.push({ kind: "removed", text: a[i++]! })
  while (j < b.length) lines.push({ kind: "added", text: b[j++]! })
  return lines
}
