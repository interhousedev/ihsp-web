import type { BookInput, BookSubjectInput, ItemLanguage, ItemType, RightsBasis, Rights } from "@ihsp/api"

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
export const RIGHTS_CLASSES: readonly Rights[] = ["public_domain", "open_license", "permission", "official"]
export const SUBJECT_ROLES: readonly BookSubjectInput["role"][] = ["textbook", "core", "supplementary", "reference"]
export const YEARS_OF_STUDY: readonly number[] = [1, 2]

/** How a public-domain book proves its status: the author's death, an anonymous work, or a rule text alone. */
export type BasisKind = "death" | "anonymous" | "other"

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
  rights: Rights
  licence: string
  basisKind: BasisKind
  deathYear: string
  firstPublishedYear: string
  rule: string
  sourceUrl: string
  attribution: string
  permissionScope: string
  permissionExpiresOn: string
  reference: string
  proofFileId: string | null
  proofFileName: string | null
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
    rights: "public_domain",
    licence: "",
    basisKind: "death",
    deathYear: "",
    firstPublishedYear: "",
    rule: "",
    sourceUrl: "",
    attribution: "",
    permissionScope: "",
    permissionExpiresOn: "",
    reference: "",
    proofFileId: null,
    proofFileName: null,
    coverFileId: null,
    coverUrl: null,
    visibility: "lyceum",
    downloadAllowed: true,
  }
}

const text = (value: string | number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value)

/** Which visibility a rights class allows: `public` only for public domain and open licences (§ 3.4). */
export function allowsPublic(rights: Rights): boolean {
  return rights === "public_domain" || rights === "open_license"
}

/** The form for a saved book (`BookDraft.input`). `coverUrl` is the card's cover, shown until a new one is uploaded. */
export function formFromInput(input: BookInput, coverUrl: string | null): BookForm {
  const basis = input.rights_basis
  const basisKind: BasisKind =
    basis.author_death_year != null ? "death" : basis.first_published_year != null ? "anonymous" : "other"
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
    rights: input.rights,
    licence: text(input.licence),
    basisKind,
    deathYear: text(basis.author_death_year),
    firstPublishedYear: text(basis.first_published_year),
    rule: text(basis.rule),
    sourceUrl: text(basis.source_url),
    attribution: text(basis.attribution),
    permissionScope: text(basis.permission_scope),
    permissionExpiresOn: text(basis.permission_expires_on),
    reference: text(basis.reference),
    proofFileId: input.rights_proof_file_id ?? null,
    proofFileName: null,
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

/** The basis of the chosen class only: fields of the other classes are left out, so they cannot linger. */
export function basisFromForm(form: BookForm): RightsBasis {
  switch (form.rights) {
    case "public_domain":
      return {
        ...(form.basisKind === "death" ? { author_death_year: toInt(form.deathYear) } : {}),
        ...(form.basisKind === "anonymous" ? { first_published_year: toInt(form.firstPublishedYear) } : {}),
        rule: orNull(form.rule),
      }
    case "open_license":
      return { source_url: orNull(form.sourceUrl), attribution: orNull(form.attribution) }
    case "permission":
      return { permission_scope: orNull(form.permissionScope), permission_expires_on: orNull(form.permissionExpiresOn) }
    case "official":
      return { reference: orNull(form.reference) }
  }
}

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
    rights: form.rights,
    licence: form.rights === "open_license" ? orNull(form.licence) : null,
    rights_basis: basisFromForm(form),
    rights_proof_file_id: form.rights === "permission" ? form.proofFileId : null,
    cover_file_id: form.coverFileId,
    visibility: allowsPublic(form.rights) ? form.visibility : "lyceum",
    download_allowed: form.downloadAllowed,
  }
}

/** True when two states would save the same book. */
export function sameForm(a: BookForm, b: BookForm): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
