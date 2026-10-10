import type { ArtifactItem, DocumentCard } from "@ihsp/api"

export type DocumentFormat = DocumentCard["kind"]

/** The Office format a ready output downloads as: report → .docx, data table → .xlsx, slides → .pptx. */
export function documentFormat(kind: ArtifactItem["kind"]): DocumentFormat | null {
  if (kind === "report") return "docx"
  if (kind === "data_table") return "xlsx"
  if (kind === "slides") return "pptx"
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
export function documentFileName(title: string, format: DocumentFormat): string {
  const base = title
    .normalize("NFKC")
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 60)
    .replaceAll(/-+$/g, "")
  return `${base || "document"}.${format}`
}
