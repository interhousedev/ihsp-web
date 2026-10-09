import type {
  ArtifactKind,
  CoursePlanOptions,
  DataTableOptions,
  FlashcardsOptions,
  InfographicOptions,
  LessonDraftOptions,
  MindMapOptions,
  ReportFormat,
  ReportOptions,
  SlidesOptions,
} from "@ihsp/api"

/** The longest focus text the API accepts (`prompt`, docs/reference/notebooklm.md § 3.4.0). */
export const MAX_FOCUS_LENGTH = 1000
export const MIN_ROWS = 10
export const MAX_ROWS = 40

export type Count = NonNullable<FlashcardsOptions["count"]>
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
export type FlashcardsState = CommonState & { kind: "flashcards"; count: Count; difficulty: Level }
export type QuizState = CommonState & {
  kind: "quiz"
  count: Count
  difficulty: Level
  types: readonly QuizType[]
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

export type FormState =
  | CoursePlanState
  | LessonDraftState
  | ReportState
  | MindMapState
  | FlashcardsState
  | QuizState
  | DataTableState
  | SlidesState
  | InfographicState

/** Kinds that have a form (audio is phase 3). */
export type FormKind = FormState["kind"]

export function hasForm(kind: ArtifactKind): kind is FormKind {
  return kind !== "audio_overview"
}

const EMPTY: CommonState = { language: "auto", focus: "" }

/** The defaults of a form; `buildCreate(initialState(...))` equals `defaultCreate(...)` of the tile. */
export function initialState(kind: FormKind, format: ReportFormat = "conspect"): FormState {
  switch (kind) {
    case "report":
      return { ...EMPTY, kind, format, detail: "standard", style: "outline" }
    case "mind_map":
      return { ...EMPTY, kind, detail: "overview" }
    case "flashcards":
      return { ...EMPTY, kind, count: "standard", difficulty: "medium" }
    case "quiz":
      return { ...EMPTY, kind, count: "standard", difficulty: "medium", types: QUIZ_TYPES }
    case "data_table":
      return { ...EMPTY, kind, maxRows: "25" }
    case "slides":
      return { ...EMPTY, kind, format: "presenter", length: "default" }
    case "infographic":
      return { ...EMPTY, kind, orientation: "portrait", detail: "standard", style: "clean" }
    case "course_plan":
      return { ...EMPTY, kind, depth: "overview", sections: "" }
    case "lesson_draft":
      return { ...EMPTY, kind, stepId: "new", length: "standard", includeTest: false, includeFlashcards: false }
  }
}

/** Why Generate must stay disabled, if it must. */
export type FormProblem = "focus-required" | "types-required" | "sections-invalid"

export function formProblem(state: FormState): FormProblem | null {
  if (state.kind === "report" && state.format === "custom" && state.focus.trim() === "") return "focus-required"
  if (state.kind === "quiz" && state.types.length === 0) return "types-required"
  if (state.kind === "course_plan" && state.sections.trim() !== "") {
    const count = Number(state.sections)
    if (!Number.isInteger(count) || count < MIN_SECTIONS || count > MAX_SECTIONS) return "sections-invalid"
  }
  return null
}
