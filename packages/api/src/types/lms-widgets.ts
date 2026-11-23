// LMS — exam (Bluebook-style SAT/AP), runnable code and custom HTML blocks (editor and learner player).
// Mirrors app/modules/lms/domain/step_content.py and application/learning/views.py of iht-backend.

import type { BlockResult } from "./lms-interactive"
import type { Answer } from "./lms-learning"
import type { Question } from "./lms-authoring"

export type ExamKind = "sat" | "ap" | "custom"
export type ExamCalculator = "none" | "scientific" | "graphing"
/** Question types an exam module may ask. */
export type ExamQuestionType = "single" | "multiple" | "number" | "text" | "free"

/** A timed module of an exam section; `time_limit_sec` is 60..14400. */
export type ExamModule = {
  id: string
  title: string
  time_limit_sec: number
  questions: Question[]
}

/** A section of an exam: at most 4 modules, taken in order. */
export type ExamSection = {
  id: string
  title: string
  modules: ExamModule[]
  adaptive: boolean
}

/** The scaled score range of every section (SAT: 200..800). */
export type ExamScaling = { min_score: number; max_score: number }

/** An exam block of the step content (authoring): at most 6 sections. */
export type ExamBlock = {
  id: string
  type: "exam"
  title: string
  kind: ExamKind
  directions: string
  /** Markdown; empty means no reference sheet. */
  reference_sheet: string
  calculator: ExamCalculator
  sections: ExamSection[]
  scaling: ExamScaling | null
}

export type CodeLanguage = "python" | "javascript" | "sql"

/** A test of a code block; a hidden test shows only its name to students. */
export type CodeTest = { id: string; name: string; code: string; hidden: boolean }

/** A runnable code block (authoring); `solution` never reaches students. */
export type CodeBlock = {
  id: string
  type: "code"
  language: CodeLanguage
  instructions: string
  starter: string
  solution: string
  tests: CodeTest[]
  /** 1000..30000, default 5000. */
  time_limit_ms: number
  graded: boolean
}

/** An author-uploaded HTML widget (authoring); empty `package_id` means not uploaded yet. */
export type HtmlBlock = {
  id: string
  type: "html"
  title: string
  package_id: string
  entry: "index.html"
  /** 200..2000, default 600. */
  height_px: number
  allow_fullscreen: boolean
  graded: boolean
}

/** An exam as the student sees it: structure and timing, no questions or answers. */
export type LearningExamBlock = {
  id: string
  type: "exam"
  title: string
  kind: ExamKind
  directions: string
  reference_sheet: string
  calculator: ExamCalculator
  sections: {
    id: string
    title: string
    adaptive: boolean
    modules: { id: string; title: string; time_limit_sec: number; questions_count: number }[]
  }[]
  scaling: ExamScaling | null
  passed: boolean
  /** My exam result once finished (raw points). */
  result?: BlockResult | null
}

/** A code block as the student sees it: no solution; hidden tests have empty `code`. */
export type LearningCodeBlock = {
  id: string
  type: "code"
  language: CodeLanguage
  instructions: string
  starter: string
  tests: { id: string; name: string; hidden: boolean; code: string }[]
  time_limit_ms: number
  graded: boolean
  passed: boolean
  /** My best reported score (graded blocks). */
  result?: BlockResult | null
}

/** The hidden tests of a graded code block, fetched on submit. */
export type LearningHiddenTests = { tests: { id: string; name: string; hidden: boolean; code: string }[] }

export type LearningHtmlBlock = {
  id: string
  type: "html"
  title: string
  package_id: string
  entry: string
  height_px: number
  allow_fullscreen: boolean
  graded: boolean
  passed: boolean
  /** My best reported score (graded widgets). */
  result?: BlockResult | null
}

export type ExamStatus = "not_started" | "in_module" | "between" | "finished"

/** Where a module sits in the exam (`module_no` is 2 for either adaptive second module). */
export type ExamModuleRef = {
  section_id: string
  module_id: string
  section_title: string
  module_title: string
  section_no: number
  module_no: number
  time_limit_sec: number
  questions_count: number
}

/** A question of an exam module, without correctness. */
export type ExamQuestion = {
  id: string
  type: string
  prompt: string
  points: number
  options?: { id: string; text: string }[] | null
}

/** The open module: its server deadline, questions and my saved answers. */
export type ExamModuleRun = ExamModuleRef & {
  started_at: string
  deadline_at: string
  questions: ExamQuestion[]
  answers: Record<string, Answer>
}

export type ExamSectionScore = {
  section_id: string
  title: string
  score: number
  max_score: number
  scaled_score: number | null
}

export type ExamReviewItem = {
  question_id: string
  correct: boolean
  correct_answer: Record<string, unknown> | null
  explanation: string | null
}

export type ExamModuleReview = ExamModuleRef & {
  late: boolean
  score: number
  max_score: number
  questions: ExamQuestion[]
  answers: Record<string, Answer>
  review: ExamReviewItem[]
}

export type ExamResult = {
  finished_at: string
  score: number
  max_score: number
  scaled_total: number | null
  scaled_min: number | null
  scaled_max: number | null
  sections: ExamSectionScore[]
  modules: ExamModuleReview[]
}

/** GET/POST .../blocks/{block_id}/exam*: my sitting. Mirrors LearningExamSessionView. */
export type ExamSession = {
  block_id: string
  status: ExamStatus
  server_now: string
  modules_done: number
  current: ExamModuleRun | null
  next: ExamModuleRef | null
  next_is_new_section: boolean
  result: ExamResult | null
}

export type AiReviewTemplate = "review_table" | "rubric_checklist" | "strengths_cards" | "image_gallery"
export type AiReviewFileKind = "pdf" | "docx" | "pptx" | "image" | "text"

/** One row of the review: a criterion, what it means and its top score (0..100). */
export type AiReviewCriterion = { name: string; description: string; max_score: number }

/** A reference file the teacher uploaded; never shown to students. */
export type AiReviewFile = { file_id: string; name: string }

/** An AI reviewer of a student's work (authoring). The prompt, files, private topics and criteria descriptions stay
 * on the server; only the title, public instructions, limits and template reach students. */
export type AiReviewBlock = {
  id: string
  type: "ai_review"
  title: string
  instructions_public: string
  teacher_prompt: string
  output_template: AiReviewTemplate
  /** At most 20. */
  criteria: AiReviewCriterion[]
  use_course_materials: boolean
  /** At most 10. */
  reference_files: AiReviewFile[]
  web_search: boolean
  /** At most 30, each up to 200 characters. */
  private_topics: string[]
  /** 1..20, default 3. */
  max_submissions: number
  /** 0..100, default 60: the share of the criteria points a final review needs to pass the block. */
  pass_threshold_pct: number
  /** At least one. */
  accepted_types: AiReviewFileKind[]
}

/** An AI review block as the student sees it (mirrors LearningAiReviewBlockView). */
export type LearningAiReviewBlock = {
  id: string
  type: "ai_review"
  title: string
  instructions_public: string
  output_template: AiReviewTemplate
  criteria: { name: string; max_score: number }[]
  max_submissions: number
  accepted_types: AiReviewFileKind[]
  /** True once I have a reviewed session for the block. */
  passed: boolean | null
}
