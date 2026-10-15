// Notebooks (NotebookLM-style) and Studio: copied verbatim from the backend contract.
// Additions (request bodies, query parameters, stream events) are at the end of the file.

import type { AgentStep, WebQuota, WebResult } from "./ai"
import type { CoursePlanContent, CoursePlanOptions, LessonDraftContent, LessonDraftOptions } from "./course-workspace"

export type SourceKind =
  | "file"
  | "chat"
  | "lesson_resource"
  | "flashcard_set"
  | "lms_step"
  | "text"
  | "note"
  | "url"
  | "web_result"
  | "library_item"
  | "library_notes"
export type SourceStatus = "pending" | "processing" | "ready" | "failed" | "unavailable" | "stale"
export type SourceFailure =
  | "unsupported_type"
  | "no_text"
  | "too_large"
  | "fetch_failed"
  | "forbidden"
  | "deleted"
  | "provider_error"

export type SourceInput =
  | { kind: "file"; file_id: string }
  | { kind: "chat"; chat_id: string; until_seq?: number }
  | { kind: "lesson_resource"; lesson_id: string; link_id: string }
  | { kind: "flashcard_set"; set_id: string }
  | {
      kind: "lms_step"
      course_id: string
      step_id: string
      /** Course workspaces: read the DRAFT of the step. */ draft?: boolean
    }
  | { kind: "text"; title: string; text: string }
  | { kind: "note"; title: string; body_md: string }
  | {
      kind: "url"
      url: string
      /** The title the search found (Discover). */ title?: string
    }
  | {
      kind: "library_item"
      item_id: string
      file_id?: string
      page_from?: number
      page_to?: number
    }

export type SourceItem = {
  id: string
  notebook_id: string
  kind: SourceKind
  title: string
  status: SourceStatus
  failure: SourceFailure | null
  selected: boolean
  position: number
  word_count: number
  passage_count: number
  origin: {
    subject?: string
    lesson_date?: string
    topic?: string
    role?: string
    course_title?: string
  } | null
  ref: Record<string, string | number>
  stale: boolean
  has_guide: boolean
  /** The topic labels of the source (`LabelItem.id`), at most 3. */
  label_ids: string[]
  /** The input kind of the source: text, image, audio, video or pdf. */
  modality: string
  /** The model does not read this kind: the source stays in the notebook but is not sent to it. */
  ai_unsupported: boolean
  /**
   * TODO(contract): the lesson/subject sync owns the source (lesson material, lesson book, subject material copy).
   * In a subject or lesson notebook it is excluded instead of removed; false for the student's own sources.
   */
  synced: boolean
  synced_at: string | null
  created_at: string
}
export type SourceGuide = {
  summary: string
  key_topics: string[]
  questions: string[]
}
/** The uploaded file behind a `file` source or a file-based lesson material (preview and download). */
export type SourceFile = {
  id: string
  name: string
  content_type: string
  byte_size: number
}
/** `GET …/sources/{sid}/file-url?disposition=inline|attachment`: a presigned URL valid for 60 seconds. */
export type SourceFileUrl = { url: string; expires_at: string }
export type SourceDetail = SourceItem & {
  guide: SourceGuide | null
  body_md: string | null
  editable: boolean
  citations: Citation[]
  /** Null for sources that did not come from an upload (text, link, chat, library item…). */
  file: SourceFile | null
}
export type PassageItem = {
  id: string
  seq: number
  text: string
  page: number | null
  heading: string | null
}
export type PassageDetail = {
  passage: PassageItem
  source: { id: string; title: string; kind: SourceKind }
  before: PassageItem[]
  after: PassageItem[]
}

export type ChatStyle = "default" | "learning_guide" | "custom"
export type ChatConfig = {
  style: ChatStyle
  custom_prompt: string | null
  length: "default" | "shorter" | "longer"
  language: "auto" | "uz" | "ru" | "en"
  /** What the student is working on (up to 300 characters); shapes the answers. */
  goal?: string | null
}
export type NotebookSummary = {
  summary: string
  key_topics: string[]
  suggested_questions: string[]
  generated_at: string
}
/** How a notebook came to be: made by hand, kept in sync with a subject or a lesson, or the workspace of an LMS course. */
export type NotebookOrigin = "manual" | "subject_auto" | "lesson_auto" | "course" | "course_student"
export type NotebookItem = {
  id: string
  title: string
  emoji: string | null
  pinned: boolean
  source_count: number
  last_opened_at: string | null
  updated_at: string
  origin: NotebookOrigin
  /** The subject a `subject_auto` notebook follows; null otherwise. */
  subject_id: string | null
  /** The lesson a `lesson_auto` notebook follows; null otherwise. */
  lesson_id: string | null
  /** The group of a teacher's subject notebook; null otherwise. */
  group_id: string | null
  /** The LMS course this notebook is the workspace of; null for a student's own notebook. */
  course_id: string | null
  /** False for staff who may only read the workspace (`view_drafts`); true for owners of personal notebooks. */
  can_write: boolean
}
/** A subject (teachers: subject and group) with its notebook, which is made on the first open. */
export type SubjectNotebookSlot = {
  subject_id: string
  subject_name: string
  group_id: string | null
  group_name: string | null
  notebook_id: string | null
  source_count: number
}
/** Sync settings of an automatic notebook (`NotebookDetail.auto`). */
export type AutoSettings = {
  excluded_refs: { ref_key: string; title: string }[]
  include_classmates: boolean
  synced_at: string | null
}
/** TODO(contract): `PATCH /v1/notebooks/{id}/auto` body; every field is optional. */
export type NotebookAutoPatchBody = {
  include_classmates?: boolean
  /** Synced sources to leave out; the sync keeps them out until restored. */
  exclude_source_ids?: string[]
  /** `excluded_refs[].ref_key` values to bring back. */
  restore_refs?: string[]
}
export type NotebookDetail = NotebookItem & {
  /** Sync settings; null for a notebook that is not automatic. */
  auto: AutoSettings | null
  chat_config: ChatConfig
  summary: NotebookSummary | null
  summary_status: "none" | "stale" | "building" | "ready" | "failed"
  ready_source_count: number
  selected_source_count: number
  created_at: string
}

export type Citation = {
  n: number
  passage_id: string
  source_id: string
  source_title: string
  source_kind: SourceKind
  page: number | null
  snippet: string
}
export type Anchor = { kind: "passages"; ids: string[] } | { kind: "text"; text: string }
export type NotebookMessage = {
  id: string
  seq: number
  role: "user" | "assistant"
  text: string // assistant text contains ⟦1⟧ or ⟦1,2⟧ markers
  citations: Citation[]
  followups: string[]
  source_ids: string[]
  /** Pages of the web search; `⟦w1⟧` chips in `text` point at them. */
  web: WebResult[]
  retrieval: boolean
  grounded: boolean
  feedback: "up" | "down" | null
  stopped: boolean
  created_at: string
  /** What the assistant did while answering (AI-STEPS). TODO(contract): replace with generated */
  steps?: AgentStep[]
}
export type NotebookTurn = {
  user_message: NotebookMessage
  assistant_message: NotebookMessage
  usage: NotebookUsage
  action: ArtifactCreate | null // P2: the assistant proposes a Studio output; the web shows an action card
}
export type AddSourcesResult = {
  items: SourceItem[]
  rejected: {
    index: number
    error: {
      type: string
      title: string
      status: number
      message_key: string
      params: Record<string, unknown>
    }
  }[]
}

export type UsagePart = {
  used: number
  /** `null`: unlimited (staff). */
  limit: number | null
  resets_at: string | null
}
export type NotebookUsage = {
  budget: { session: UsagePart; day: UsagePart }
  quotas: Record<
    "artifacts" | "audio_overview" | "slides" | "infographic",
    { used: number; limit: number | null; resets_at: string }
  >
  generating: number
  generating_limit: number
}

export type ArtifactKind =
  | "report"
  | "mind_map"
  | "flashcards"
  | "quiz"
  | "data_table"
  | "slides"
  | "infographic"
  | "course_plan"
  | "lesson_draft"
export type ReportFormat = "conspect" | "study_guide" | "briefing" | "faq" | "timeline" | "article" | "custom"
export type ArtifactStatus = "queued" | "generating" | "ready" | "failed" | "canceled"
export type ArtifactError = {
  code: string
  message_key: string
  params: Record<string, unknown>
}
type CommonOptions = { language?: "uz" | "ru" | "en"; source_ids?: string[] }
type Level = "easy" | "medium" | "hard"
type Count = "fewer" | "standard" | "more"
export type ReportOptions = CommonOptions & {
  format: ReportFormat
  detail?: "short" | "standard" | "long"
  style?: "outline" | "cornell" | "thesis"
}
export type MindMapOptions = CommonOptions & {
  detail?: "overview" | "detailed"
}
export type FlashcardsOptions = CommonOptions & {
  count?: Count
  difficulty?: Level
}
export type QuizOptions = CommonOptions & {
  count?: Count
  difficulty?: Level
  types?: ("single" | "multiple" | "true_false")[]
}
export type DataTableOptions = CommonOptions & { max_rows?: number }
export type SlidesOptions = CommonOptions & {
  format?: "presenter" | "detailed"
  length?: "short" | "default" | "long"
}
export type InfographicOptions = CommonOptions & {
  orientation?: "portrait" | "landscape" | "square"
  detail?: "concise" | "standard" | "detailed"
  style?: "clean" | "sketch" | "bento" | "scientific" | "playful"
}
export type ArtifactOptions =
  | ReportOptions
  | MindMapOptions
  | FlashcardsOptions
  | QuizOptions
  | DataTableOptions
  | SlidesOptions
  | InfographicOptions
  | CoursePlanOptions
  | LessonDraftOptions

export type ArtifactCreate = { prompt?: string } & (
  | { kind: "report"; options: ReportOptions }
  | { kind: "mind_map"; options?: MindMapOptions }
  | { kind: "flashcards"; options?: FlashcardsOptions }
  | { kind: "quiz"; options?: QuizOptions }
  | { kind: "data_table"; options?: DataTableOptions }
  | { kind: "slides"; options?: SlidesOptions }
  | { kind: "infographic"; options?: InfographicOptions }
  | { kind: "course_plan"; options?: CoursePlanOptions }
  | { kind: "lesson_draft"; options?: LessonDraftOptions }
)
export type ArtifactItem = {
  id: string
  notebook_id: string
  kind: ArtifactKind
  format: ReportFormat | null
  title: string
  status: ArtifactStatus
  error: ArtifactError | null
  options: ArtifactOptions
  prompt: string | null
  source_count: number
  sampled: boolean
  unread: boolean
  progress: number | null
  has_assets: boolean
  parent_id: string | null
  flashcard_set_id: string | null
  created_at: string
  finished_at: string | null
}
export type RefsIndex = Record<
  string,
  {
    passage_id: string
    source_id: string
    source_title: string
    source_kind: SourceKind
    page: number | null
    snippet: string
  }
>

export type ReportContent = {
  title: string
  markdown: string // contains ⟦n⟧ markers, exactly like a chat answer
  citations: Citation[] // the numbered citations of the markers
  headings: { level: number; text: string; id: string }[]
}
export type MindMapNode = {
  id: string
  parent_id: string | null
  label: string
  note: string
  refs: string[]
}
export type MindMapContent = { title: string; nodes: MindMapNode[] }
export type FlashcardsContent = {
  title: string
  cards: {
    id: string
    front: string
    back: string
    hint: string | null
    topic: string | null
    refs: string[]
  }[]
}
export type QuizQuestion = {
  id: string
  type: "single" | "multiple" | "true_false"
  prompt: string
  options: { id: string; text: string }[]
  correct: string[]
  explanation: string
  hint: string | null
  difficulty: "easy" | "medium" | "hard"
  topic: string | null
  refs: string[]
}
export type QuizContent = { title: string; questions: QuizQuestion[] }
export type DataTableContent = {
  title: string
  columns: { key: string; label: string; type: "text" | "number" | "date" }[]
  rows: { cells: Record<string, string>; refs: string[] }[]
}
export type Slide = {
  id: string
  layout: "title" | "agenda" | "section" | "bullets" | "two_columns" | "quote" | "table" | "summary"
  title: string
  bullets?: string[]
  body?: string
  left?: { heading: string; bullets: string[] }
  right?: { heading: string; bullets: string[] }
  quote?: { text: string; attribution: string | null }
  table?: { columns: string[]; rows: string[][] }
  notes: string
  visual_hint?: string | null
  refs: string[]
}
export type SlidesContent = {
  title: string
  subtitle: string | null
  slides: Slide[]
}
export type InfographicBlock = {
  type: "stat" | "steps" | "comparison" | "list" | "timeline" | "definition" | "quote" | "callout"
  title: string
  items: { head: string; body: string }[]
  columns?: { title: string; points: string[] }[]
  refs: string[]
}
export type InfographicContent = {
  title: string
  subtitle: string | null
  footer: string | null
  blocks: InfographicBlock[]
}
export type AssetItem = {
  idx: number
  kind: "audio_turn"
  duration_ms: number
  bytes: number
}

type Detail<K extends ArtifactKind, C> = ArtifactItem & {
  kind: K
  content: C | null
}
export type ArtifactDetail = (
  | Detail<"report", ReportContent>
  | Detail<"mind_map", MindMapContent>
  | Detail<"flashcards", FlashcardsContent>
  | Detail<"quiz", QuizContent>
  | Detail<"data_table", DataTableContent>
  | Detail<"slides", SlidesContent>
  | Detail<"infographic", InfographicContent>
  | Detail<"course_plan", CoursePlanContent>
  | Detail<"lesson_draft", LessonDraftContent>
) & {
  refs_index: RefsIndex
  source_map: Record<string, string>
  progress_state: Record<string, unknown> | null
  assets: AssetItem[]
}

// --- Additions: request bodies, query parameters and stream events (§ 4.3, § 3.3.6) ---

export type NotebooksParams = { q?: string; cursor?: string; limit?: number }
export type NotebookCreateBody = { title?: string; emoji?: string }
export type NotebookPatchBody = {
  title?: string
  emoji?: string
  pinned?: boolean
  chat_config?: ChatConfig
}
export type SourcesSelectBody = { selected: boolean; ids?: string[] }
export type SourcesAddBody = { items: SourceInput[] }
export type SourcePatchBody = {
  title?: string
  selected?: boolean
  body_md?: string
}
export type PassagesParams = { cursor?: string; limit?: number }
export type PassageParams = { context?: number }
/** `command` + `args` is a slash command that the server turns into the question; `text` may then be empty. */
/** A lesson, or one material (`id` = link id) of a lesson, the question is about. */
// TODO(contract): replace with generated
export type ChatAttachment = { kind: "lesson"; id: string } | { kind: "material"; id: string; lesson_id: string }
export type NotebookMessageBody = {
  text: string
  source_ids?: string[]
  anchor?: Anchor
  // TODO(contract): replace with generated
  attachments?: ChatAttachment[]
  web_search?: boolean
  command?: string
  args?: string
}
export type NotebookFeedbackBody = { rating: "up" | "down"; comment?: string }
export type SaveNoteBody = { title?: string }
export type ArtifactsParams = { kind?: ArtifactKind; status?: ArtifactStatus }
export type ArtifactPatchBody = { title: string }
export type ArtifactProgressBody = { state: Record<string, unknown> }
export type FlashcardSetResult = { set_id: string; created: boolean }
export type SlidesPutBody = { slides: Slide[] }
export type SlidesReviseBody = {
  changes: { slide_id: string; instruction: string }[]
}
export type NotebookChatHistory = { messages: NotebookMessage[] }

/** `GET …/search?q&limit`: the passages that contain the words, grouped by source (up to 3 hits each). */
export type SourceSearchParams = { q: string; limit?: number }
export type SourceSearchHit = {
  passage_id: string
  seq: number
  page: number | null
  snippet: string
}
export type SourceSearchGroup = {
  source_id: string
  title: string
  kind: SourceKind
  hits: SourceSearchHit[]
}
export type SourceSearchResponse = {
  query: string
  sources: SourceSearchGroup[]
}

/** Topic labels of the sources (`auto` ones come from the light model, `manual` ones are never overwritten). */
export type LabelOrigin = "auto" | "manual"
export type LabelItem = {
  id: string
  name: string
  emoji: string
  position: number
  origin: LabelOrigin
  source_count: number
}
export type LabelsAuto = {
  status: "idle" | "running" | "failed"
  finished_at: string | null
  error: string | null
}
export type LabelsResponse = { items: LabelItem[]; auto: LabelsAuto }
export type LabelCreateBody = { name: string; emoji: string }
export type LabelPatchBody = { name?: string; emoji?: string }
export type SourceLabelsBody = { label_ids: string[] }
export type LabelsAutoResult = { status: "running" }

/** `POST …/discover`: `fast` is one web search, `deep` plans several and costs `WebQuota.deep_cost`. */
export type DiscoverBody = { query: string; mode: "fast" | "deep" }
export type DiscoverResult = {
  title: string
  url: string
  site: string
  snippet: string
  why: string
  /** `db`: from the platform's own database (shown as "Из базы IHSP"). */
  origin?: "web" | "db"
  /** A `db` result is added by reference: a library item, or a copy of a notebook passage. */
  ref_kind?: "library_item" | "notebook_source" | null
  ref_id?: string | null
  /** The notebook already has this page as a source. */
  already_added: boolean
}
export type DiscoverResponse = {
  mode: "fast" | "deep"
  queries: string[]
  results: DiscoverResult[]
  quota: WebQuota
}

/** The final event of a streamed answer: the stored assistant message (and the user message / usage when sent). */
export type NotebookStreamDone = {
  assistant_message: NotebookMessage
  user_message?: NotebookMessage
  usage?: NotebookUsage
  action?: ArtifactCreate | null
}
/** Server-sent events of `POST …/chat/messages` and `…/chat/regenerate` with `Accept: text/event-stream` (P1b). */
export type NotebookStreamEvent =
  | { event: "message"; data: { id: string; seq: number } }
  | { event: "delta"; data: { text: string } }
  | { event: "citation"; data: Citation }
  | { event: "web"; data: { results: WebResult[] } }
  /** A step started or finished (AI-STEPS); the same `id` arrives again when it ends. */
  | { event: "step"; data: AgentStep }
  | { event: "done"; data: NotebookStreamDone }
  | {
      event: "error"
      data: {
        type?: string
        title?: string
        message_key?: string
        params?: Record<string, unknown>
      }
    }

export type SaveToFilesBody = { format?: "docx" | "xlsx" | "pptx" | "md" }
/** The file made from a Studio output in "My files". */
export type SavedArtifactFile = {
  id: string
  name: string
  content_type: string
  byte_size: number
}
export type AttachArtifactBody = {
  lesson_id: string
  role?: "material" | "attachment"
}
/** The lesson resource made from a Studio output. */
export type AttachedResource = {
  link_id: string
  lesson_id: string
  title: string
  short_url: string
}

// --- Default materials of a subject (admin): every student's subject notebook gets a copy. ---

/** What a default material points at. */
export type SubjectMaterialKind = "file" | "link" | "library_item"
/** One default material of an EMIS subject id (`edu_subject_id`). */
export type SubjectMaterial = {
  id: string
  edu_subject_id: number
  kind: SubjectMaterialKind
  title: string
  /** Only for `kind: "link"`. */
  url: string | null
  /** Only for `kind: "file"`. */
  file_id: string | null
  /** Only for `kind: "library_item"`. */
  library_item_id: string | null
  position: number
  created_at: string
}
/** The default materials of one EMIS subject id. */
export type SubjectMaterialGroup = { edu_subject_id: number; materials: SubjectMaterial[] }
/** Exactly the target that `kind` names is given: `url`, `file_id` or `library_item_id`. */
export type SubjectMaterialCreateBody = {
  kind: SubjectMaterialKind
  /** 1–255 characters. */
  title: string
  url?: string | null
  file_id?: string | null
  library_item_id?: string | null
}

// --- A teacher's subjects and the materials they keep for them (staff) ---

/** A group, or one subgroup (1 or 2), a teacher teaches a subject to. */
export type StaffSubjectGroup = { group_id: string; group_name: string; subgroup: number | null }
/** A subject the teacher teaches this term, with its groups. */
export type StaffSubject = { subject_id: string; name: string; groups: StaffSubjectGroup[] }
/** A material of one group (and subgroup) of the teacher. */
export type StaffGroupMaterial = SubjectMaterial & { group_id: string; group_name: string; subgroup: number | null }
/** The three tiers: administration (read-only), the teacher's for all their groups, per group. */
export type StaffSubjectMaterials = {
  subject: StaffSubject
  admin: SubjectMaterial[]
  mine: SubjectMaterial[]
  groups: StaffGroupMaterial[]
}
/** A material for all the teacher's groups, or with `group_id` (and `subgroup` 1 or 2) for one group. */
export type StaffSubjectMaterialCreateBody = SubjectMaterialCreateBody & {
  group_id?: string | null
  subgroup?: number | null
}
