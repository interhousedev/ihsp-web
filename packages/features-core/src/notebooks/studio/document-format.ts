import type { ArtifactItem, DocumentCard } from "@ihsp/api"

export type DocumentFormat = DocumentCard["kind"]
/** The files the server renders: Office files, flash cards as CSV, and Markdown for the rest. */
export type ExportFormat = DocumentFormat | "csv" | "md"
/** What the menu can download: a server file, or a PNG the browser draws (mind map, infographic). */
export type DownloadFormat = ExportFormat | "png"

/** The Office format a ready output downloads as: report, quiz and exercise → .docx, data table → .xlsx, slides → .pptx. */
export function documentFormat(kind: ArtifactItem["kind"]): DocumentFormat | null {
  if (kind === "report" || kind === "quiz" || kind === "exercise") return "docx"
  if (kind === "data_table") return "xlsx"
  if (kind === "slides") return "pptx"
  return null
}

/** The downloads of a ready output, the main one first: its native file, then an optional second one. */
export function downloadFormats(kind: ArtifactItem["kind"]): DownloadFormat[] {
  const office = documentFormat(kind)
  if (office) return [office]
  if (kind === "flashcards") return ["csv"]
  if (kind === "mind_map") return ["png", "md"]
  if (kind === "infographic") return ["png"]
  return []
}

/** The file "Add to my files" stores: Office for report, quiz, table and slides; Markdown for the other kinds. */
export function filesFormat(kind: ArtifactItem["kind"]): DocumentFormat | "md" | null {
  const office = documentFormat(kind)
  if (office) return office
  if (kind === "mind_map" || kind === "flashcards" || kind === "infographic") return "md"
  return null
}

/** Saves a blob on the user's device. */
export function saveBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.rel = "noopener"
    anchor.style.display = "none"
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** A file name from an output title: letters and digits of any script, single hyphens, at most 60 characters. */
export function documentFileName(title: string, format: DownloadFormat): string {
  const base = title
    .normalize("NFKC")
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 60)
    .replaceAll(/-+$/g, "")
  return `${base || "document"}.${format}`
}
