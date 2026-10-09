// Library (`library.ihsu.uz`): docs/reference/study-library.md § 7.5 (contract, copied verbatim) and §§ 7.1, 7.2
// (request and response shapes the contract leaves open, added at the end of the file).
// Theses and projects (§ 7.3) are not part of this file.

import type { Page } from "./common"

export type ItemKind = "external" | "book" | "material"
export type ItemType =
  | "textbook"
  | "manual"
  | "fiction"
  | "poetry"
  | "drama"
  | "nonfiction"
  | "reference"
  | "dictionary"
  | "lab_manual"
  | "problem_book"
  | "article"
  | "teaching_material"
  | "presentation"
  | "worksheet"
  | "lecture_notes"
  | "notes"
  | "practice_set"
  | "formula_sheet"
  | "other"
export type ItemStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "published"
  | "held"
  | "rejected"
  | "unpublished"
  | "gone"
export type ItemVisibility = "public" | "lyceum" | "hidden"
export type Rights = "public_domain" | "open_license" | "permission" | "official"
export type Importance = "essential" | "recommended" | "further"

// Plain `type` aliases (not interfaces): the OpenAPI schema of the card/detail/queue row/TOC entry is free-form
// (`additionalProperties`), and only a type alias is assignable to an index-signature type (contract check).
export type ItemCard = {
  id: string | null // null for an external record that is not stored yet
  slug: string | null
  kind: ItemKind
  type: ItemType
  title: string
  author_label: string
  language: string
  year_published: number | null
  cover_url: string | null
  description_excerpt: string | null
  subjects: { id: string; name: string }[]
  years_of_study: number[]
  has_text: boolean
  page_count: number | null
  shelf_state: "want" | "reading" | "done" | null
  progress_percent: number | null // book and material only
  snippet?: string | null
  snippet_page?: number | null
  tag: { source: "unilibrary" | "book" | "material"; label: string }
  material?: {
    uploader_name: string
    uploader_cohort: string
    uploader_role: "student" | "teacher" | "librarian" | "admin"
  }
  book?: { rights: Rights; licence: string | null; download_allowed: boolean }
  external?: {
    source: "unilibrary"
    external_id: string
    category: 1 | 2 | 3 | 4
    access: "open" | "partial" | "closed"
    type_name: string
    field_name: string
    view_url: string // https://unilibrary.uz/literature/{id}
    gone: boolean
  }
}

export interface ItemFile {
  id: string
  format: "pdf" | "epub" | "md" | "txt" | "docx" | "pptx"
  is_primary: boolean
  pages: number | null
  byte_size: number
  readable: boolean
  text_status: "none" | "pending" | "ready" | "no_text" | "failed"
  toc: TocEntry[]
}

export type TocEntry = {
  title: string
  page?: number
  href?: string
  level: number
}

/**
 * System codes of `status_reason` (OpenAPI `StatusReasonCode`). Any other value is free text written by a librarian or a
 * teacher; clients translate a known code and show anything else as it is.
 */
export type StatusReasonCode =
  | "withdrawn_by_owner"
  | "reported"
  | "superseded"
  | "account_closed"
  | "unpublished"
  | "takedown"

/** Where the caller stopped in an item (`ItemDetail.progress`). */
export interface ItemProgress {
  file_id: string
  locator: Annotation["locator"]
  percent: number
}

export type ItemDetail = ItemCard & {
  status: ItemStatus
  /** A `StatusReasonCode` or free text. */
  status_reason: StatusReasonCode | (string & Record<never, never>) | null
  /** Where the caller stopped; absent or `null` when they never opened it (and always for external records). */
  progress?: ItemProgress | null
  status_note: string | null
  visibility: ItemVisibility
  subtitle: string | null
  description: string | null
  publisher: string | null
  isbn: string | null
  files: ItemFile[] // empty for external
  topics: { id: string; name: string; page_from: number | null; page_to: number | null }[]
  lists: { id: string; title: string; importance: Importance }[]
  rights_box?: { text: string; attribution: string | null; download_allowed: boolean } // books
  external_keywords?: string[] // from the detail call
  external_isbn?: string | null
  can: { read: boolean; download: boolean; add_to_notebook: boolean; report: boolean; edit: boolean }
}

export interface UploadRow {
  item: ItemCard
  status: ItemStatus
  /** A `StatusReasonCode` or free text. */
  reason: StatusReasonCode | (string & Record<never, never>) | null
  review_message: string | null
  queue_position: number | null
}

export interface MaterialInput {
  title: string
  description: string
  subject_ids: string[]
  topic_ids: string[]
  years_of_study: number[]
  type: ItemType
  language: ItemLanguage
  licence: "all_rights_reserved" | "cc_by" | "cc_by_sa" | "cc_by_nc" | "cc_by_nc_sa"
  body_md?: string
  attested: boolean
}

export type QueueRow = {
  item: ItemCard
  kind: "student_material" | "teacher_material" | "suggestion" | "report" | "rights"
  uploader?: { name: string; cohort: string; role: string }
  scan: { findings: string[] }
  reports: { reason: string; count: number }[]
  submitted_at: string
}

export interface Annotation {
  id: string
  item_id: string
  file_id: string
  kind: "highlight" | "note" | "bookmark"
  locator: { page: number } | { cfi: string; progress: number }
  quote: string | null
  note: string | null
  color: "yellow" | "green" | "blue" | "pink"
  client_id: string
  updated_at: string
}

export interface LessonItemRef {
  item: { id: string; title: string }
  section_label: string
  page_from: number | null
  page_to: number | null
}

export interface Feed {
  id: string
  name: string
  enabled: boolean
  params: {
    category: number
    field_ids: number[]
    type_ids: number[]
    language_ids: number[]
    access: ("open" | "partial" | "closed")[]
  }
  max_items: number
  estimate: number | null
  last_run_at: string | null
  last_status: "ok" | "error" | null
  last_count: number | null
}

// - - - Additions: shapes of § 7.1 and § 7.2 that § 7.5 leaves open - - -

export type ShelfState = "want" | "reading" | "done"
export type AnnotationKind = Annotation["kind"]
export type AnnotationColor = Annotation["color"]
export type AnnotationLocator = Annotation["locator"]
export type ItemLanguage = "uz_latn" | "uz_cyrl" | "ru" | "en" | "qq" | "other"
export type MaterialLicence = MaterialInput["licence"]
export type UploaderRole = NonNullable<ItemCard["material"]>["uploader_role"]

/** `?source=` of the catalogue search; `all` is the default. */
export type ItemSource = "all" | "book" | "material" | "external"

/** `GET /library/items` query (§ 7.1). */
export type ItemsParams = {
  q?: string
  source?: ItemSource
  subject_id?: string
  topic_id?: string
  year_of_study?: number
  type?: ItemType
  language?: string
  collection_id?: string
  uploader_role?: "student" | "teacher"
  has_text?: boolean
  shelf?: ShelfState | "any"
  sort?: "relevance" | "newest" | "title" | "author"
  cursor?: string
  limit?: number
}

/** `GET /library/items/{id}/files/{fid}/url` (15 minutes). */
export type ItemFileUrl = { url: string; expires_at: string; content_type: string; byte_size: number }

/** `GET /library/items/{id}/text?page_from&page_to`. */
export type ItemTextParams = { page_from?: number; page_to?: number }
export type ItemText = { pages: { page: number; text: string }[] }

/**
 * `GET /library/subjects` (*anon*): the subjects that have library items, with counts. Not in § 7.1, but the home
 * page's subject shelves and every subject filter need it.
 */
export interface LibrarySubject {
  id: string
  name: string
  item_count: number
}

/** `GET /library/topics?subject_id` — a tree per subject. */
export interface Topic {
  id: string
  subject_id: string
  name: string
  slug: string
  year_of_study: number | null
  children: Topic[]
}

export interface Collection {
  id: string
  slug: string
  title: string
  description: string | null
  cover_url: string | null
  item_count: number
}
export interface CollectionDetail extends Collection {
  items: ItemCard[]
}

export type ReadingListScope = "subject" | "groups" | "school"
export type ReadingListStatus = "draft" | "published" | "archived"

/** `GET /library/reading-lists?subject_id&mine&group_id&status`. */
export type ReadingListsParams = { subject_id?: string; mine?: boolean; group_id?: string; status?: ReadingListStatus }

export interface ReadingListCard {
  id: string
  title: string
  description: string | null
  scope: ReadingListScope
  status: ReadingListStatus
  subject: { id: string; name: string } | null
  year_of_study: number | null
  academic_year: string | null
  term_half: 1 | 2 | null
  owner: { id: string; name: string }
  entry_count: number
  essential_count: number
  essential_done: number
  updated_at: string
}

export interface ReadingListEntry {
  position: number
  item: ItemCard | null // null for a plain link
  url: string | null
  title: string | null
  importance: Importance
  page_from: number | null
  page_to: number | null
  week_label: string | null
  due_on: string | null // YYYY-MM-DD
  topic_id: string | null
  note: string | null
  read_state: ShelfState | null // derived from my shelf
}

export interface ReadingListDetail extends ReadingListCard {
  group_ids: string[]
  entries: ReadingListEntry[]
  can_edit: boolean
}

export interface ReadingListInput {
  title: string
  description?: string | null
  scope: ReadingListScope
  subject_id?: string | null
  group_ids?: string[]
  year_of_study?: number | null
  academic_year?: string | null
  term_half?: 1 | 2 | null
  status?: ReadingListStatus
}

export interface ReadingListItemInput {
  item_id?: string | null
  url?: string | null
  title?: string | null
  importance: Importance
  page_from?: number | null
  page_to?: number | null
  week_label?: string | null
  due_on?: string | null
  topic_id?: string | null
  note?: string | null
}

/** `GET /library/external/unilibrary/search?...` (not stored). */
export type UniLibraryAccessFilter = "open" | "partial" | "closed" | "any"
export type UniLibrarySearchParams = {
  q?: string
  subject_id?: string
  field_id?: number
  type_id?: number
  language?: string
  access?: UniLibraryAccessFilter
  page?: number
}
export interface UniLibrarySearchResult {
  items: ItemCard[]
  page: number
  total: number
  stale: boolean
}
export interface UniLibraryTaxonomy {
  types: { id: number; name: string }[]
  fields: { id: number; name: string }[]
  languages: { id: number; name: string }[]
  access: { id: UniLibraryAccessFilter; name: string }[]
}

/** `GET /me/library`. */
export interface MeLibrary {
  continue: ItemCard[]
  shelf_counts: Record<ShelfState, number>
  offline: { max_items: number; max_bytes: number }
}

/** `GET /me/library/shelf?state&cursor`; a taken-down item stays as a `removed` row. */
export interface ShelfEntry {
  item: ItemCard
  state: ShelfState
  finished_at: string | null
  updated_at: string
  removed: boolean
}
export type ShelfParams = { state?: ShelfState; cursor?: string; limit?: number }

/** `PUT /me/library/progress/{item_id}`. */
export interface ProgressBody {
  file_id: string
  locator: Annotation["locator"]
  percent: number
  client_ts: string
  seconds_read?: number
}

/** `GET /me/library/annotations?item_id&kind&color&q&cursor`. */
export type AnnotationsParams = {
  item_id?: string
  kind?: AnnotationKind
  color?: AnnotationColor
  q?: string
  cursor?: string
  limit?: number
}
export interface AnnotationInput {
  client_id: string
  item_id: string
  file_id: string
  kind: AnnotationKind
  locator: Annotation["locator"]
  quote?: string | null
  note?: string | null
  color: AnnotationColor
}
export interface AnnotationPatchBody {
  note?: string | null
  color?: AnnotationColor
}
export interface AnnotationsSyncBody {
  upserts: AnnotationInput[]
  deletes: string[]
}

/** `GET /me/library/uploads?status`. */
export type UploadsParams = { status?: ItemStatus; cursor?: string; limit?: number }

/** `POST /library/materials/{id}/files` — ids of files uploaded with purpose `library_material`. */
export interface MaterialFilesBody {
  file_ids: string[]
}
export interface MaterialPatchBody {
  title?: string
  description?: string
  topic_ids?: string[]
  body_md?: string
  /** Owner, draft or changes requested: ticking the attestation of a saved draft. */
  attested?: boolean
}

/** `GET /library/my-groups`: the groups a teacher teaches or curates (librarians and Administration get all). */
export interface LibraryGroup {
  id: string
  name: string
}

/** `POST /library/suggestions`. */
export interface SuggestionBody {
  title: string
  url?: string
  file_id?: string
  note?: string
}

/** `POST /library/items/{id}/report`. */
export type LibraryReportReason =
  | "wrong_content"
  | "copyright"
  | "inappropriate"
  | "personal_data"
  | "exam_leak"
  | "spam"
  | "other"
export interface LibraryReportBody {
  reason: LibraryReportReason
  text?: string
}

/** `POST /library/external/unilibrary/{external_id}/item` — stores the snapshot so it can go on a shelf or a list. */
export interface PinExternalBody {
  category: 1 | 2 | 3 | 4
}

// - - - Librarian area (§ 7.2) - - -

export type QueueTab = "review" | "reports" | "held" | "rights" | "suggestions"
export type QueueParams = { tab: QueueTab; cursor?: string; limit?: number }
/** `POST /manage/library/items/{id}/{action}`. */
export type ModerationAction = "approve" | "request-changes" | "reject" | "hold" | "restore" | "unpublish"
export interface ModerationBody {
  /** A `StatusReasonCode`, or short own words (at most 40 characters). */
  reason?: string
  /** A free message to the owner (at most 2000 characters). */
  note?: string
}
/** `POST /manage/library/reports/{id}/resolve`. */
export type ReportResolveAction = "dismiss" | "hold" | "unpublish" | "unpublish_and_warn"
export interface ReportResolveBody {
  action: ReportResolveAction
}
/** Ids a queue row needs to act on (added to § 7.5's `QueueRow`; absent on rows the contract defines without them). */
export type QueueRowIds = {
  report_ids?: string[]
  suggestion?: { id: string; title: string; url: string | null; note: string | null; user_name: string }
}
export type ManageQueueRow = QueueRow & QueueRowIds

/** Rights basis of a book (§ 3.4); the fields used depend on the class. */
export interface RightsBasis {
  author_death_year?: number | null
  first_published_year?: number | null
  rule?: string | null
  source_url?: string | null
  attribution?: string | null
  permission_scope?: string | null
  permission_expires_on?: string | null
  reference?: string | null
}

export interface BookTopicInput {
  topic_id: string
  page_from?: number | null
  page_to?: number | null
}
export interface BookSubjectInput {
  subject_id: string
  role: "textbook" | "core" | "supplementary" | "reference"
  year_of_study?: number | null
}

/** `POST /manage/library/books` and `PATCH /manage/library/books/{id}`. */
export interface BookInput {
  title: string
  subtitle?: string | null
  authors: string[]
  translators?: string[]
  language: ItemLanguage
  year_published?: number | null
  publisher?: string | null
  isbn?: string | null
  type: ItemType
  description?: string | null
  years_of_study: number[]
  subjects: BookSubjectInput[]
  topics: BookTopicInput[]
  rights: Rights
  licence?: string | null
  rights_basis: RightsBasis
  rights_proof_file_id?: string | null
  cover_file_id?: string | null
  visibility: ItemVisibility
  download_allowed: boolean
}
export type BookAction = "publish" | "unpublish" | "takedown"
export interface BookActionBody {
  reason?: string
}
export interface BookFileBody {
  file_id: string
  format: ItemFile["format"]
  is_primary: boolean
}
/** `POST /manage/library/import` — rows with errors are listed, good rows become drafts. */
export interface ImportBody {
  csv_file_id: string
}
export interface ImportResult {
  created: number
  errors: { row: number; message: string }[]
}

/** Not in § 7.2: the librarian's book table and the editor's data (needs a `GET` the contract lacks). */
export type BookRowsParams = { q?: string; status?: ItemStatus; cursor?: string; limit?: number }
export interface BookRow {
  item: ItemCard
  status: ItemStatus
  visibility: ItemVisibility
  rights: Rights
  text_status: ItemFile["text_status"]
  updated_at: string
}
export interface BookDraft {
  item: ItemDetail
  input: BookInput
  checklist: { key: string; ok: boolean }[]
}
/** `422 library/rights-incomplete` and the publish checklist: `params.missing[]`. */
export interface PublishChecklistProblem {
  missing: string[]
}

export interface TopicInput {
  subject_id: string
  parent_id?: string | null
  name: { uz: string; ru: string; en: string }
  slug?: string
  year_of_study?: number | null
}
export interface ManageTopic {
  id: string
  subject_id: string
  parent_id: string | null
  name: { uz: string; ru: string; en: string }
  slug: string
  position: number
  year_of_study: number | null
}
export interface CollectionInput {
  title: { uz: string; ru: string; en: string }
  description?: { uz: string; ru: string; en: string } | null
  cover_file_id?: string | null
  published: boolean
  item_ids?: string[]
}
export interface ManageCollection {
  id: string
  slug: string
  title: { uz: string; ru: string; en: string }
  description: { uz: string; ru: string; en: string } | null
  cover_url: string | null
  published: boolean
  position: number
  item_ids: string[]
}

/** `GET /manage/library/stats?from&to`. */
export interface LibraryStats {
  opens: number
  readers: number
  queue: { length: number; oldest_age_hours: number | null; average_hours: number | null }
  uploads_by_day: { day: string; count: number }[]
  searches_without_results: { q: string; count: number }[]
  top_items: { item: ItemCard; opens: number }[]
  items_by_status: Partial<Record<ItemStatus, number>>
  reports_by_reason: Partial<Record<LibraryReportReason, number>>
  subjects_without_materials: { id: string; name: string }[]
}

/** Administration only. */
export interface UniLibrarySettings {
  enabled: boolean
  anonymous_cards: boolean
}
export interface UniLibraryStatus {
  breaker: "closed" | "open" | "half_open"
  last_calls: { at: string; ok: boolean; ms: number; path: string }[]
  cache: { hits: number; misses: number; stale_served: number }
  hidden_records: ItemCard[]
}
export interface FeedInput {
  name: string
  params: Feed["params"]
  max_items: number
}
export type FeedAction = "dry-run" | "run" | "enable" | "disable"
export interface FieldMapEntry {
  subject_id: string
  external_field_id: number
}
export interface Sanction {
  id: string
  user_id: string
  kind: "warning" | "upload_ban"
  until: string | null
  reason: string
  item_id: string | null
  created_at: string
}
export interface SanctionBody {
  user_id: string
  kind: Sanction["kind"]
  until?: string
  reason: string
}

/** A page of cards, as most list endpoints answer. */
export type ItemCardPage = Page<ItemCard>
