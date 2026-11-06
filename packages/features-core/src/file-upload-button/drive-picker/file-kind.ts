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

export type FileKind = "image" | "video" | "pdf" | "slides" | "sheet" | "doc" | "text" | "archive" | "audio" | "other"

/** What a file is, from its content type. */
export function fileKindOf(file: Pick<FileItem, "content_type">): FileKind {
  const type = file.content_type.toLowerCase()
  if (type.startsWith("image/")) return "image"
  if (type.startsWith("video/")) return "video"
  if (type === "application/pdf") return "pdf"
  if (type.startsWith("audio/")) return "audio"
  if (type.includes("presentationml") || type.includes("ms-powerpoint")) return "slides"
  if (type.includes("spreadsheetml") || type.includes("ms-excel")) return "sheet"
  if (type.includes("wordprocessingml") || type.includes("msword")) return "doc"
  if (/zip|x-rar|x-7z|x-tar/.test(type)) return "archive"
  if (type.startsWith("text/")) return "text"
  return "other"
}

const TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  zip: "application/zip",
  txt: "text/plain",
  md: "text/markdown",
}

/** A content type from a file name, for the icon of APIs that return only the name. Never used for security. */
export function contentTypeOfName(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase() ?? ""
  return TYPE_BY_EXTENSION[extension] ?? "application/octet-stream"
}
