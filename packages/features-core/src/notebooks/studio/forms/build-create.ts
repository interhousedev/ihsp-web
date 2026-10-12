import type { ArtifactCreate } from "@ihsp/api"
import {
  MAX_FOCUS_LENGTH,
  MAX_ROWS,
  MIN_ROWS,
  QUIZ_TYPES,
  type CommonState,
  type CoursePlanState,
  type DataTableState,
  type FlashcardsState,
  type FormState,
  type InfographicState,
  type LessonDraftState,
  type MindMapState,
  type QuizState,
  type ReportState,
  type SlidesState,
} from "./form-state"

/** `{ language }` for an explicit choice, nothing for Auto (the server then follows the chat or interface language). */
function languageOf(state: CommonState): { language?: "uz" | "ru" | "en" } {
  return state.language === "auto" ? {} : { language: state.language }
}

/** `{ prompt }` for a non-empty focus text (trimmed, at most 1000 characters), nothing otherwise. */
function promptOf(state: CommonState): { prompt?: string } {
  const prompt = state.focus.trim().slice(0, MAX_FOCUS_LENGTH)
  return prompt === "" ? {} : { prompt }
}

/** Whole number from 10 to 40; text that is not a number gives the default of 25. */
export function clampRows(value: string): number {
  const rows = Math.round(Number(value))
  if (value.trim() === "" || !Number.isFinite(rows)) return 25
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, rows))
}

export function buildReportCreate(state: ReportState): ArtifactCreate {
  return {
    kind: "report",
    options: {
      format: state.format,
      detail: state.detail,
      // Only a conspect has a style (outline, Cornell notes, theses).
      ...(state.format === "conspect" ? { style: state.style } : {}),
      ...languageOf(state),
    },
    ...promptOf(state),
  }
}

export function buildMindMapCreate(state: MindMapState): ArtifactCreate {
  return { kind: "mind_map", options: { detail: state.detail, ...languageOf(state) }, ...promptOf(state) }
}

export function buildFlashcardsCreate(state: FlashcardsState): ArtifactCreate {
  return {
    kind: "flashcards",
    options: { count: state.count, difficulty: state.difficulty, ...languageOf(state) },
    ...promptOf(state),
  }
}

export function buildQuizCreate(state: QuizState): ArtifactCreate {
  return {
    kind: "quiz",
    options: {
      count: state.count,
      difficulty: state.difficulty,
      // Always in the canonical order, whatever order the boxes were ticked in.
      types: QUIZ_TYPES.filter((type) => state.types.includes(type)),
      ...languageOf(state),
    },
    ...promptOf(state),
  }
}

export function buildDataTableCreate(state: DataTableState): ArtifactCreate {
  return {
    kind: "data_table",
    options: { max_rows: clampRows(state.maxRows), ...languageOf(state) },
    ...promptOf(state),
  }
}

export function buildSlidesCreate(state: SlidesState): ArtifactCreate {
  return {
    kind: "slides",
    options: { format: state.format, length: state.length, ...languageOf(state) },
    ...promptOf(state),
  }
}

export function buildInfographicCreate(state: InfographicState): ArtifactCreate {
  return {
    kind: "infographic",
    options: { orientation: state.orientation, detail: state.detail, style: state.style, ...languageOf(state) },
    ...promptOf(state),
  }
}

export function buildCoursePlanCreate(state: CoursePlanState): ArtifactCreate {
  const sections = Number(state.sections)
  return {
    kind: "course_plan",
    options: {
      depth: state.depth,
      ...(state.sections.trim() !== "" && Number.isInteger(sections) ? { sections_hint: sections } : {}),
      ...languageOf(state),
    },
    ...promptOf(state),
  }
}

export function buildLessonDraftCreate(state: LessonDraftState): ArtifactCreate {
  return {
    kind: "lesson_draft",
    options: {
      step_id: state.stepId === "new" ? null : state.stepId,
      length: state.length,
      ...(state.includeTest ? { include_test: true } : {}),
      ...(state.includeFlashcards ? { include_flashcards: true } : {}),
      ...languageOf(state),
    },
    ...promptOf(state),
  }
}

/** The same request restricted to the given sources (`options.source_ids`); the server uses only the ready ones. */
export function withSourceIds(create: ArtifactCreate, sourceIds: readonly string[]): ArtifactCreate {
  // Every member of the union takes `source_ids` in its options; the spread keeps the kind, so the cast is sound.
  return { ...create, options: { ...create.options, source_ids: [...sourceIds] } } as ArtifactCreate
}

/** The request body of a form's state. */
export function buildCreate(state: FormState): ArtifactCreate {
  switch (state.kind) {
    case "report":
      return buildReportCreate(state)
    case "mind_map":
      return buildMindMapCreate(state)
    case "flashcards":
      return buildFlashcardsCreate(state)
    case "quiz":
      return buildQuizCreate(state)
    case "data_table":
      return buildDataTableCreate(state)
    case "slides":
      return buildSlidesCreate(state)
    case "infographic":
      return buildInfographicCreate(state)
    case "course_plan":
      return buildCoursePlanCreate(state)
    case "lesson_draft":
      return buildLessonDraftCreate(state)
  }
}
