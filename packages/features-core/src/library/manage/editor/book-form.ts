import type { BookInput, BookSubjectInput, ItemLanguage, ItemType } from "@ihsp/api"

/** The types a book can have (materials have their own). */
export const BOOK_TYPES: readonly ItemType[] = [
  "textbook",
  "manual",
  "fiction",
  "poetry",
  "drama",
  "nonfiction",
  "reference",
  "dictionary",
  "lab_manual",
  "problem_book",
  "article",
  "other",
]
export const BOOK_LANGUAGES: readonly ItemLanguage[] = ["uz_latn", "uz_cyrl", "ru", "en", "qq", "other"]
export const SUBJECT_ROLES: readonly BookSubjectInput["role"][] = ["textbook", "core", "supplementary", "reference"]
export const YEARS_OF_STUDY: readonly number[] = [1, 2]

export type TopicRow = { topic_id: string; page_from: string; page_to: string }

/** The editor's state: every field as the user types it (numbers and dates stay strings until saved). */
export type BookForm = {
  title: string
  subtitle: string
  authors: string[]
  translators: string[]
  language: ItemLanguage
  yearPublished: string
  publisher: string
  isbn: string
  type: ItemType
  description: string
  yearsOfStudy: number[]
  subjects: BookSubjectInput[]
  topics: TopicRow[]
  coverFileId: string | null
  coverUrl: string | null
  visibility: "public" | "lyceum"
  downloadAllowed: boolean
}

export function emptyForm(title = ""): BookForm {
  return {
    title,
    subtitle: "",
    authors: [],
    translators: [],
    language: "uz_latn",
    yearPublished: "",
    publisher: "",
    isbn: "",
    type: "textbook",
    description: "",
    yearsOfStudy: [],
    subjects: [],
    topics: [],
    coverFileId: null,
    coverUrl: null,
    visibility: "lyceum",
    downloadAllowed: true,
  }
}

const text = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value)

/** The form for a saved book (`BookDraft.input`). `coverUrl` is the card's cover, shown until a new one is uploaded. */
export function formFromInput(input: BookInput, coverUrl: string | null): BookForm {
  return {
    ...emptyForm(),
    title: input.title,
    subtitle: text(input.subtitle),
    authors: input.authors,
    translators: input.translators ?? [],
    language: input.language,
    yearPublished: text(input.year_published),
    publisher: text(input.publisher),
    isbn: text(input.isbn),
    type: input.type,
    description: text(input.description),
    yearsOfStudy: input.years_of_study,
    subjects: input.subjects,
    topics: input.topics.map((row) => ({
      topic_id: row.topic_id,
      page_from: text(row.page_from),
      page_to: text(row.page_to),
    })),
    coverFileId: input.cover_file_id ?? null,
    coverUrl,
    visibility: input.visibility === "public" ? "public" : "lyceum",
    downloadAllowed: input.download_allowed,
  }
}

const toInt = (value: string): number | null => {
  const trimmed = value.trim()
  if (!/^-?\d+$/.test(trimmed)) return null
  return Number(trimmed)
}
const orNull = (value: string): string | null => value.trim() || null

/** The request body for `POST` and `PATCH /manage/library/books`. */
export function inputFromForm(form: BookForm): BookInput {
  return {
    title: form.title.trim(),
    subtitle: orNull(form.subtitle),
    authors: form.authors,
    translators: form.translators,
    language: form.language,
    year_published: toInt(form.yearPublished),
    publisher: orNull(form.publisher),
    isbn: orNull(form.isbn),
    type: form.type,
    description: orNull(form.description),
    years_of_study: form.yearsOfStudy,
    subjects: form.subjects,
    topics: form.topics
      .filter((row) => row.topic_id)
      .map((row) => ({ topic_id: row.topic_id, page_from: toInt(row.page_from), page_to: toInt(row.page_to) })),
    cover_file_id: form.coverFileId,
    visibility: form.visibility,
    download_allowed: form.downloadAllowed,
  }
}

/** True when two states would save the same book. */
export function sameForm(a: BookForm, b: BookForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
