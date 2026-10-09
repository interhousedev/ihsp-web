import type { ItemLanguage, ItemType, MaterialLicence } from "@ihsp/api"

// Constants of the upload wizard (docs/reference/study-library.md §§ 3.5 and 9.2). The limits are hints only: the
// server is the authority and answers `library/file-too-large` or `library/too-many-pages`.

/** What the uploader brings: a Markdown note, a PDF (teachers may also bring DOCX or PPTX) or photos of paper notes. */
export type UploadKind = "markdown" | "pdf" | "photos"
export const UPLOAD_KINDS: readonly UploadKind[] = ["markdown", "pdf", "photos"]

/** Up to 20 images are combined into one PDF on the server. */
export const MAX_PHOTOS = 20
/** Photos are scaled down to this longest side (JPEG) before they are sent. */
export const MAX_IMAGE_SIDE = 2400
export const TITLE_MAX = 200
export const DESCRIPTION_MAX = 2000
export const MARKDOWN_MAX = 200_000

export const YEARS_OF_STUDY: readonly number[] = [1, 2]

/** The `ItemType` values that describe a material (books have their own types). */
export const MATERIAL_TYPES: readonly ItemType[] = [
  "notes",
  "lecture_notes",
  "teaching_material",
  "presentation",
  "worksheet",
  "practice_set",
  "formula_sheet",
  "other",
]

export const MATERIAL_LANGUAGES: readonly ItemLanguage[] = ["uz_latn", "uz_cyrl", "ru", "en", "qq", "other"]

/** The Creative Commons licences a teacher may choose when the material is public. */
export const OPEN_LICENCES: readonly MaterialLicence[] = ["cc_by", "cc_by_sa", "cc_by_nc", "cc_by_nc_sa"]

export type UploadLimits = {
  /** Largest single file in bytes. */
  bytes: number
  /** Most pages of one PDF, or `null` when no page limit is stated. */
  pages: number | null
}

const MB = 1024 * 1024
export const STUDENT_LIMITS: UploadLimits = { bytes: 20 * MB, pages: 60 }
export const TEACHER_LIMITS: UploadLimits = { bytes: 100 * MB, pages: null }

/** Teachers and administrators have the larger limits; students (and student librarians) the smaller ones. */
export const limitsFor = (publishesDirectly: boolean): UploadLimits =>
  publishesDirectly ? TEACHER_LIMITS : STUDENT_LIMITS

/** The language a new material most likely has: the one the page is shown in. */
export function defaultLanguage(locale: string): ItemLanguage {
  if (locale === "ru") return "ru"
  if (locale === "en") return "en"
  return "uz_latn"
}
