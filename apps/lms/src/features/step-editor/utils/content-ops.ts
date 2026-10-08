import type { Block, Question, StepContent, TestConfig } from "@ihsp/api"

export type TestBlock = Extract<Block, { type: "test" }>
export type TextBlock = Extract<Block, { type: "text" }>
export type FlashcardsBlock = Extract<Block, { type: "flashcards" }>
export type QuestionType = Question["type"]
export type QuestionOption = NonNullable<Question["options"]>[number]
export type Card = FlashcardsBlock["cards"][number]

export const QUESTION_TYPES: readonly QuestionType[] = ["single", "multiple", "text", "number"]
export const SHOW_ANSWERS: readonly TestConfig["show_answers"][] = [
  "never",
  "after_submit",
  "after_pass",
  "after_last_attempt",
]

export const DEFAULT_TEST_CONFIG: TestConfig = {
  max_attempts: null,
  passing_score_pct: 60,
  shuffle_questions: false,
  shuffle_options: false,
  pool_size: null,
  time_limit_sec: null,
  cooldown_sec: null,
  show_answers: "after_submit",
}

/** The server assigns the real ids on save (LMS-23); until then new items carry unique placeholder ids. */
export const TEMP_ID_PREFIX = "tmp-"

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

export function newTempId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14)
  return `${TEMP_ID_PREFIX}${random}`
}

export function newOption(): QuestionOption {
  return { id: newTempId(), text: "", correct: false, pinned: false }
}

export function newQuestion(type: QuestionType = "single"): Question {
  const base = { id: newTempId(), type, prompt: "", points: 1, explanation: null }
  if (type === "single" || type === "multiple")
    return { ...base, options: [{ ...newOption(), correct: true }, newOption()] }
  if (type === "text") return { ...base, answer: { accepted: [""], regex: null, case_sensitive: false } }
  return { ...base, answer: { value: 0, tolerance: 0 } }
}

export function newTextBlock(): TextBlock {
  return { id: newTempId(), type: "text", markdown: "" }
}

export function newTestBlock(): TestBlock {
  return { id: newTempId(), type: "test", config: { ...DEFAULT_TEST_CONFIG }, questions: [newQuestion("single")] }
}

export function newFlashcardsBlock(): FlashcardsBlock {
  return { id: newTempId(), type: "flashcards", cards: [{ id: newTempId(), front: "", back: "" }] }
}

export function newCard(): Card {
  return { id: newTempId(), front: "", back: "" }
}

/** Changing the type keeps the prompt, points and explanation and swaps the answer data. */
export function changeQuestionType(question: Question, type: QuestionType): Question {
  if (question.type === type) return question
  const base = {
    id: question.id,
    type,
    prompt: question.prompt,
    points: question.points,
    explanation: question.explanation,
  }
  if (type === "single" || type === "multiple") {
    let options = question.options ?? newQuestion(type).options ?? []
    if (type === "single") {
      // a single choice has exactly one correct option
      const firstCorrect = options.findIndex((option) => option.correct)
      options = options.map((option, index) => ({ ...option, correct: index === firstCorrect }))
    }
    return { ...base, options }
  }
  return { ...base, answer: newQuestion(type).answer }
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list]
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  if (item !== undefined) copy.splice(to, 0, item)
  return copy
}

export function updateBlock(content: StepContent, blockId: string, update: (block: Block) => Block): StepContent {
  return { ...content, blocks: content.blocks.map((block) => (block.id === blockId ? update(block) : block)) }
}

/**
 * The server replaced placeholder ids with its own in the answer to a save. `sent` is what was saved and `returned`
 * what came back (same structure and order); `local` is what the editor holds now, possibly with newer edits.
 * Returns `local` with the placeholder ids swapped, plus the pairs for the caller to keep React keys stable.
 */
export function remapIds(
  local: StepContent,
  sent: StepContent,
  returned: StepContent,
): { content: StepContent; aliases: [string, string][] } {
  const map = new Map<string, string>()
  const pair = (from: { id: string } | undefined, to: { id: string } | undefined) => {
    if (from && to && from.id !== to.id) map.set(from.id, to.id)
  }
  sent.blocks.forEach((block, blockIndex) => {
    const other = returned.blocks[blockIndex]
    pair(block, other)
    if (block.type === "test" && other?.type === "test") {
      block.questions.forEach((question, questionIndex) => {
        const otherQuestion = other.questions[questionIndex]
        pair(question, otherQuestion)
        question.options?.forEach((option, optionIndex) => pair(option, otherQuestion?.options?.[optionIndex]))
      })
    } else if (block.type === "flashcards" && other?.type === "flashcards") {
      block.cards.forEach((card, cardIndex) => pair(card, other.cards[cardIndex]))
    }
  })
  if (map.size === 0) return { content: local, aliases: [] }
  const swap = (id: string) => map.get(id) ?? id
  const content: StepContent = {
    ...local,
    blocks: local.blocks.map((block): Block => {
      if (block.type === "test") {
        return {
          ...block,
          id: swap(block.id),
          questions: block.questions.map((question) => ({
            ...question,
            id: swap(question.id),
            ...(question.options
              ? { options: question.options.map((option) => ({ ...option, id: swap(option.id) })) }
              : {}),
          })),
        }
      }
      if (block.type === "flashcards") {
        return { ...block, id: swap(block.id), cards: block.cards.map((card) => ({ ...card, id: swap(card.id) })) }
      }
      return { ...block, id: swap(block.id) }
    }),
  }
  return { content, aliases: [...map.entries()] }
}

export type ContentIssueCode =
  | "empty-prompt"
  | "too-few-options"
  | "empty-option"
  | "no-correct"
  | "several-correct"
  | "no-answers"
  | "no-questions"
  | "pool-too-large"
  | "empty-card"

export type ContentIssue = { code: ContentIssueCode; blockId: string; questionId?: string }

/** Problems an author should fix before publishing; saving a draft is still allowed. */
export function validateContent(content: StepContent): ContentIssue[] {
  const issues: ContentIssue[] = []
  for (const block of content.blocks) {
    if (block.type === "test") {
      if (block.questions.length === 0) issues.push({ code: "no-questions", blockId: block.id })
      if (block.config.pool_size !== null && block.config.pool_size > block.questions.length) {
        issues.push({ code: "pool-too-large", blockId: block.id })
      }
      for (const question of block.questions) {
        const at = { blockId: block.id, questionId: question.id }
        if (question.prompt.trim() === "") issues.push({ code: "empty-prompt", ...at })
        if (question.type === "single" || question.type === "multiple") {
          const options = question.options ?? []
          if (options.length < 2) issues.push({ code: "too-few-options", ...at })
          if (options.some((option) => option.text.trim() === "")) issues.push({ code: "empty-option", ...at })
          const correct = options.filter((option) => option.correct).length
          if (correct === 0) issues.push({ code: "no-correct", ...at })
          if (question.type === "single" && correct > 1) issues.push({ code: "several-correct", ...at })
        } else if (question.type === "text") {
          const accepted = (question.answer?.accepted ?? []).filter((item) => item.trim() !== "")
          if (accepted.length === 0 && !question.answer?.regex) issues.push({ code: "no-answers", ...at })
        }
      }
    } else if (block.type === "flashcards") {
      if (block.cards.some((card) => card.front.trim() === "" || card.back.trim() === "")) {
        issues.push({ code: "empty-card", blockId: block.id })
      }
    }
  }
  return issues
}
