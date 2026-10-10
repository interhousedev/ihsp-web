import type { Block, Question } from "@ihsp/api"
import { Icons } from "@ihsp/ui"
import {
  newFlashcardsBlock,
  newQuestion,
  newTestBlock,
  newTextBlock,
  newVideoBlock,
  type QuestionType,
} from "./content-ops"

export type StepTypeId =
  | "text"
  | "video"
  | "flashcards"
  | "test"
  | "choice"
  | "sorting"
  | "matching"
  | "table"
  | "blanks"
  | "string"
  | "number"
  | "random_number"
  | "formula"
  | "code"
  | "free"

export type StepTypeGroup = "materials" | "tests" | "answers"

export type StepType = {
  id: StepTypeId
  group: StepTypeGroup
  icon: keyof typeof Icons
  create: () => Block
}

/** A test block with one question of the type: the "step type" an author picks, like Stepik's. */
function task(type: QuestionType): () => Block {
  return () => {
    const block = newTestBlock()
    const question: Question = newQuestion(type)
    return { ...block, questions: [question] }
  }
}

/** The step types of the picker, in display order, grouped like Stepik's "Choose a step type" dialog. */
export const STEP_TYPES: readonly StepType[] = [
  { id: "text", group: "materials", icon: "text", create: newTextBlock },
  { id: "video", group: "materials", icon: "video", create: newVideoBlock },
  {
    id: "flashcards",
    group: "materials",
    icon: "flashcards",
    create: newFlashcardsBlock,
  },
  { id: "test", group: "materials", icon: "forms", create: newTestBlock },
  { id: "choice", group: "tests", icon: "checks", create: task("single") },
  {
    id: "sorting",
    group: "tests",
    icon: "gripVertical",
    create: task("sorting"),
  },
  { id: "matching", group: "tests", icon: "links", create: task("matching") },
  { id: "table", group: "tests", icon: "kanban", create: task("table") },
  { id: "blanks", group: "tests", icon: "edit", create: task("blanks") },
  { id: "string", group: "answers", icon: "post", create: task("text") },
  { id: "number", group: "answers", icon: "grades", create: task("number") },
  {
    id: "random_number",
    group: "answers",
    icon: "sparkles",
    create: task("random_number"),
  },
  {
    id: "formula",
    group: "answers",
    icon: "trendingUp",
    create: task("formula"),
  },
  { id: "code", group: "answers", icon: "code", create: task("code") },
  { id: "free", group: "answers", icon: "chat", create: task("free") },
]

export const STEP_TYPE_GROUPS: readonly StepTypeGroup[] = ["materials", "tests", "answers"]
