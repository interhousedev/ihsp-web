import type { FileItem, FileTypeFilter } from "@ihsp/api"

/** The groups of the picker's type filter, each one a `type` of `GET /v1/me/files`. */
export const DRIVE_TYPE_GROUPS = [
  { id: "all", type: null },
  { id: "documents", type: "doc" },
  { id: "images", type: "image" },
  { id: "video", type: "video" },
  { id: "presentations", type: "slides" },
  { id: "spreadsheets", type: "sheet" },
  { id: "pdf", type: "pdf" },
] as const satisfies readonly { id: string; type: FileTypeFilter | null }[]

export type DriveTypeGroup = (typeof DRIVE_TYPE_GROUPS)[number]["id"]

export type FileKind = "image" | "video" | "pdf" | "slides" | "sheet" | "doc" | "text" | "other"

/** What a file is, from its content type. */
export function fileKindOf(file: Pick<FileItem, "content_type">): FileKind {
  const type = file.content_type.toLowerCase()
  if (type.startsWith("image/")) return "image"
  if (type.startsWith("video/")) return "video"
  if (type === "application/pdf") return "pdf"
  if (type.includes("presentationml")) return "slides"
  if (type.includes("spreadsheetml")) return "sheet"
  if (type.includes("wordprocessingml")) return "doc"
  if (type.startsWith("text/")) return "text"
  return "other"
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
