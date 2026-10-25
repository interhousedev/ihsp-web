import type { ItemDetail, ItemLanguage, ItemType, MaterialInput, MaterialLicence } from "@ihsp/api"
import { MATERIAL_LANGUAGES, OPEN_LICENCES, type UploadKind } from "./upload-config"

export type PhotoRotation = 0 | 90 | 180 | 270

/** One photo of the picker: the original file, the turns the user asked for, and a preview address. */
export type PhotoItem = {
  key: string
  file: File
  rotation: PhotoRotation
  previewUrl: string | null
}

/** Everything the wizard collects. Files are kept in memory until the draft is saved. */
export type MaterialValues = {
  kind: UploadKind | null
  title: string
  description: string
  subjectIds: string[]
  topicIds: string[]
  years: number[]
  type: ItemType
  language: ItemLanguage
  /** The Markdown text of a note. */
  body: string
  pdf: File | null
  photos: PhotoItem[]
  /** Teachers only: visible without signing in, which needs a Creative Commons licence. */
  makePublic: boolean
  licence: MaterialLicence
  attested: boolean
}

export type StepId = "kind" | "details" | "files" | "licence" | "review"

/** The keys under `library.upload.problems` that a step can report. */
export type ProblemKey =
  | "kindRequired"
  | "titleRequired"
  | "subjectRequired"
  | "yearRequired"
  | "bodyRequired"
  | "pdfRequired"
  | "photosRequired"
  | "attestRequired"
  | "licenceRequired"

export function emptyValues(language: ItemLanguage): MaterialValues {
  return {
    kind: null,
    title: "",
    description: "",
    subjectIds: [],
    topicIds: [],
    years: [],
    type: "notes",
    language,
    body: "",
    pdf: null,
    photos: [],
    makePublic: false,
    licence: "all_rights_reserved",
    attested: false,
  }
}

const isLanguage = (value: string): value is ItemLanguage => (MATERIAL_LANGUAGES as readonly string[]).includes(value)

/** The kind of file an existing item carries: Markdown text, or a file (PDF, photos combined into a PDF, DOCX, PPTX). */
export function kindOfItem(item: ItemDetail): UploadKind | null {
  if (item.files.length === 0) return null
  return item.files.some((file) => file.format === "md") ? "markdown" : "pdf"
}

/** The values of a saved draft (or an item being fixed). The attestation was given when it was created. */
export function valuesFromItem(item: ItemDetail, body = ""): MaterialValues {
  return {
    ...emptyValues(isLanguage(item.language) ? item.language : "uz_latn"),
    kind: kindOfItem(item),
    title: item.title,
    description: item.description ?? "",
    subjectIds: item.subjects.map((subject) => subject.id),
    topicIds: item.topics.map((topic) => topic.id),
    years: [...item.years_of_study],
    type: item.type,
    body,
    makePublic: item.visibility === "public",
    // A draft may have been saved without it: the box is shown again in the review step. Later states had it.
    attested: item.status !== "draft",
  }
}

/** The steps shown for a new material (all five) or for an existing draft (the attestation was already given). */
export function stepsFor(existing: boolean, needsKind: boolean): StepId[] {
  if (!existing) return ["kind", "details", "files", "licence", "review"]
  return needsKind ? ["kind", "details", "files", "review"] : ["details", "files", "review"]
}

/** What the user must still fill in before leaving a step. `hasFile` tells that the item already holds a file. */
export function stepProblems(step: StepId, values: MaterialValues, hasFile = false): ProblemKey[] {
  switch (step) {
    case "kind":
      return values.kind === null ? ["kindRequired"] : []
    case "details": {
      const problems: ProblemKey[] = []
      if (values.title.trim() === "") problems.push("titleRequired")
      if (values.subjectIds.length === 0) problems.push("subjectRequired")
      if (values.years.length === 0) problems.push("yearRequired")
      return problems
    }
    case "files":
      if (values.kind === "markdown") return values.body.trim() === "" ? ["bodyRequired"] : []
      if (values.kind === "pdf") return values.pdf === null && !hasFile ? ["pdfRequired"] : []
      if (values.kind === "photos") return values.photos.length === 0 && !hasFile ? ["photosRequired"] : []
      return ["kindRequired"]
    case "licence": {
      const problems: ProblemKey[] = []
      if (values.makePublic && !OPEN_LICENCES.includes(values.licence)) problems.push("licenceRequired")
      if (!values.attested) problems.push("attestRequired")
      return problems
    }
    case "review":
      return []
  }
}

/** The licence that goes to the server: all rights reserved unless a teacher made the material public. */
export function effectiveLicence(values: MaterialValues, canPublish: boolean): MaterialLicence {
  return canPublish && values.makePublic && OPEN_LICENCES.includes(values.licence)
    ? values.licence
    : "all_rights_reserved"
}

/** The body of `POST /library/materials`. A Markdown note carries its text in `body_md`. */
export function toInput(values: MaterialValues, canPublish: boolean): MaterialInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    subject_ids: values.subjectIds,
    topic_ids: values.topicIds,
    years_of_study: values.years.toSorted((a, b) => a - b),
    type: values.type,
    language: values.language,
    licence: effectiveLicence(values, canPublish),
    ...(values.kind === "markdown" ? { body_md: values.body } : {}),
    attested: values.attested,
  }
}
