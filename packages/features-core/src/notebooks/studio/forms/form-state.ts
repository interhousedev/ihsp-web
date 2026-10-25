import type {
  CoursePlanOptions,
  DataTableOptions,
  AssessmentMode,
  ExerciseExam,
  ExerciseMode,
  ExerciseSkill,
  FlashcardsOptions,
  InfographicOptions,
  LessonDraftOptions,
  MindMapOptions,
  ReportFormat,
  ReportOptions,
  SlidesOptions,
} from "@ihsp/api"

/** The longest focus text the API accepts (`prompt`). */
export const MAX_FOCUS_LENGTH = 1000
export const MIN_ROWS = 10
export const MAX_ROWS = 40

export type Count = Exclude<NonNullable<FlashcardsOptions["count"]>, number>
export type Level = NonNullable<FlashcardsOptions["difficulty"]>
export type ReportDetail = NonNullable<ReportOptions["detail"]>
export type ReportStyle = NonNullable<ReportOptions["style"]>
export type MapDetail = NonNullable<MindMapOptions["detail"]>
export type SlidesFormat = NonNullable<SlidesOptions["format"]>
export type SlidesLength = NonNullable<SlidesOptions["length"]>
export type Orientation = NonNullable<InfographicOptions["orientation"]>
export type InfographicDetail = NonNullable<InfographicOptions["detail"]>
export type InfographicStyle = NonNullable<InfographicOptions["style"]>
export type QuizType = "single" | "multiple" | "true_false"
export type LanguageChoice = "auto" | NonNullable<DataTableOptions["language"]>

export const COUNTS: readonly Count[] = ["fewer", "standard", "more"]
export const COUNT_CHOICES: readonly CountChoice[] = [...COUNTS, "custom"]
export const LEVELS: readonly Level[] = ["easy", "medium", "hard"]
export const REPORT_DETAILS: readonly ReportDetail[] = ["short", "standard", "long"]
export const REPORT_STYLES: readonly ReportStyle[] = ["outline", "cornell", "thesis"]
export const MAP_DETAILS: readonly MapDetail[] = ["overview", "detailed"]
export const SLIDES_FORMATS: readonly SlidesFormat[] = ["presenter", "detailed"]
export const SLIDES_LENGTHS: readonly SlidesLength[] = ["short", "default", "long"]
export const ORIENTATIONS: readonly Orientation[] = ["portrait", "landscape", "square"]
export const INFOGRAPHIC_DETAILS: readonly InfographicDetail[] = ["concise", "standard", "detailed"]
export const INFOGRAPHIC_STYLES: readonly InfographicStyle[] = ["clean", "sketch", "bento", "scientific", "playful"]
export type PlanDepth = NonNullable<CoursePlanOptions["depth"]>
export type LessonLength = NonNullable<LessonDraftOptions["length"]>
export const PLAN_DEPTHS: readonly PlanDepth[] = ["overview", "detailed"]
export const LESSON_LENGTHS: readonly LessonLength[] = ["short", "standard", "long"]
export const MIN_SECTIONS = 1
export const MAX_SECTIONS = 20
export const QUIZ_TYPES: readonly QuizType[] = ["single", "multiple", "true_false"]
export const LANGUAGES: readonly LanguageChoice[] = ["auto", "uz", "ru", "en"]
/** The test type of a quiz or flash-card set; `auto` is the default and lets the server choose. */
export type TestMode = AssessmentMode
export const TEST_MODES: readonly TestMode[] = [
  "auto",
  "full_mock",
  "topic_test",
  "question_type_test",
  "vocab_test",
  "formula_recall",
  "concept_check",
  "problem_practice",
  "reading_test",
]

export const EXERCISE_EXAMS: readonly ExerciseExam[] = ["ielts_academic", "sat", "ap", "generic"]
export const EXERCISE_SKILLS: readonly ExerciseSkill[] = ["reading", "writing", "listening_script", "mixed"]
export const EXERCISE_MODES: readonly ExerciseMode[] = ["auto", "full_section", "practice", "drill"]
/** Objective questions of an exercise (the backend limit); empty means the exam's default. */
export const EXERCISE_COUNT_LIMITS = { min: 1, max: 60 } as const satisfies ExactCountLimits

/** Fields every Customize form has. */
export type CommonState = {
  /** `auto` leaves `language` out so the server picks the chat or interface language. */
  language: LanguageChoice
  /** The "What should it focus on?" text; becomes `prompt`. */
  focus: string
}

export type ReportState = CommonState & {
  kind: "report"
  format: ReportFormat
  detail: ReportDetail
  style: ReportStyle
}
export type MindMapState = CommonState & { kind: "mind_map"; detail: MapDetail }
/** A size preset, or "custom" for the exact number typed in `customCount`. */
export type CountChoice = Count | "custom"
/** Exact counts: flash cards 1 to 150, quiz questions 1 to 100 (the backend limits). */
export type ExactCountLimits = { readonly min: number; readonly max: number }
export const EXACT_COUNT_LIMITS = {
  flashcards: { min: 1, max: 150 },
  quiz: { min: 1, max: 100 },
} as const satisfies Record<string, ExactCountLimits>
/** `customCount` stays text while the student types; it is parsed by `exactCount`. */
export type CountFields = { count: CountChoice; customCount: string }
export type FlashcardsState = CommonState & CountFields & { kind: "flashcards"; difficulty: Level; mode: TestMode }
export type QuizState = CommonState &
  CountFields & {
    kind: "quiz"
    difficulty: Level
    types: readonly QuizType[]
    mode: TestMode
  }
/** `maxRows` stays text while the student types; the builder parses and clamps it. */
export type DataTableState = CommonState & { kind: "data_table"; maxRows: string }
export type SlidesState = CommonState & { kind: "slides"; format: SlidesFormat; length: SlidesLength }
export type InfographicState = CommonState & {
  kind: "infographic"
  orientation: Orientation
  detail: InfographicDetail
  style: InfographicStyle
}

/** `sections` stays text while the author types; empty means "let the model decide". */
export type CoursePlanState = CommonState & { kind: "course_plan"; depth: PlanDepth; sections: string }
/** `stepId` is a step of the course draft or `new` (the lesson becomes a new step on Apply). */
export type LessonDraftState = CommonState & {
  kind: "lesson_draft"
  stepId: string
  length: LessonLength
  includeTest: boolean
  includeFlashcards: boolean
}

/** `count` stays text while the student types; empty lets the server use the exam's default. */
export type ExerciseState = CommonState & {
  kind: "exercise"
  exam: ExerciseExam
  skill: ExerciseSkill
  difficulty: Level
  mode: ExerciseMode
  count: string
}

export type FormState =
  | ExerciseState
  | CoursePlanState
  | LessonDraftState
  | ReportState
  | MindMapState
  | FlashcardsState
  | QuizState
  | DataTableState
  | SlidesState
  | InfographicState

/** Kinds that have a form: every Studio kind (there is no audio overview). */
export type FormKind = FormState["kind"]

const EMPTY: CommonState = { language: "auto", focus: "" }

/** The defaults of a form; `buildCreate(initialState(...))` equals `defaultCreate(...)` of the tile. */
export function initialState(kind: FormKind, format: ReportFormat = "conspect"): FormState {
  switch (kind) {
    case "report":
      return { ...EMPTY, kind, format, detail: "standard", style: "outline" }
    case "mind_map":
      return { ...EMPTY, kind, detail: "overview" }
    case "flashcards":
      return { ...EMPTY, kind, count: "standard", customCount: "", difficulty: "medium", mode: "auto" }
    case "quiz":
      return {
        ...EMPTY,
        kind,
        count: "standard",
        customCount: "",
        difficulty: "medium",
        types: QUIZ_TYPES,
        mode: "auto",
      }
    case "data_table":
      return { ...EMPTY, kind, maxRows: "25" }
    case "slides":
      return { ...EMPTY, kind, format: "presenter", length: "default" }
    case "infographic":
      return { ...EMPTY, kind, orientation: "portrait", detail: "standard", style: "clean" }
    case "exercise":
      return { ...EMPTY, kind, exam: "ielts_academic", skill: "reading", difficulty: "medium", mode: "auto", count: "" }
    case "course_plan":
      return { ...EMPTY, kind, depth: "overview", sections: "" }
    case "lesson_draft":
      return { ...EMPTY, kind, stepId: "new", length: "standard", includeTest: false, includeFlashcards: false }
  }
}

/** Why Generate must stay disabled, if it must. */
export type FormProblem = "focus-required" | "types-required" | "sections-invalid" | "count-invalid"

/** The whole number a custom count stands for, or null when it is not a whole number in the limits. */
export function exactCount(value: string, limits: ExactCountLimits): number | null {
  const text = value.trim()
  if (!/^\d+$/.test(text)) return null
  const count = Number(text)
  return count >= limits.min && count <= limits.max ? count : null
}

export function formProblem(state: FormState): FormProblem | null {
  if (state.kind === "report" && state.format === "custom" && state.focus.trim() === "") return "focus-required"
  if (state.kind === "quiz" && state.types.length === 0) return "types-required"
  if (state.kind === "flashcards" || state.kind === "quiz") {
    if (state.count === "custom" && exactCount(state.customCount, EXACT_COUNT_LIMITS[state.kind]) === null) {
      return "count-invalid"
    }
  }
  if (state.kind === "exercise" && state.count.trim() !== "") {
    if (exactCount(state.count, EXERCISE_COUNT_LIMITS) === null) return "count-invalid"
  }
  if (state.kind === "course_plan" && state.sections.trim() !== "") {
    const count = Number(state.sections)
    if (!Number.isInteger(count) || count < MIN_SECTIONS || count > MAX_SECTIONS) return "sections-invalid"
  }
  return null
}
