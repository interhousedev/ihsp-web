import type { FileTypeFilter } from "@ihsp/api"
import type { MyFileFilters } from "../hooks/use-my-files"

/** The purpose views of My files; each one is a real `purpose` of `GET /v1/me/files`. */
export type FileTab = "all" | "uploaded" | "links" | "mail"

export const FILE_TABS = [
  { id: "all", purpose: undefined },
  { id: "uploaded", purpose: "ai_upload" },
  { id: "links", purpose: "link" },
  { id: "mail", purpose: "mail" },
] as const satisfies readonly { id: FileTab; purpose: MyFileFilters["purpose"] }[]

/** The file-type choices of the filter menu; each one is a `type` of `GET /v1/me/files`. */
export type FileTypeOption =
  | "all"
  | "images"
  | "documents"
  | "spreadsheets"
  | "presentations"
  | "pdf"
  | "text"
  | "video"

export const FILE_TYPE_OPTIONS = [
  { id: "all", type: undefined },
  { id: "images", type: "image" },
  { id: "documents", type: "doc" },
  { id: "spreadsheets", type: "sheet" },
  { id: "presentations", type: "slides" },
  { id: "pdf", type: "pdf" },
  { id: "text", type: "text" },
  { id: "video", type: "video" },
] as const satisfies readonly { id: FileTypeOption; type: FileTypeFilter | undefined }[]

export type FileView = "grid" | "list"

/** The server filters for the current tab, file type and search text; an empty object means no filter. */
export function fileFilters({
  tab,
  typeOption,
  q,
}: {
  tab: FileTab
  typeOption: FileTypeOption
  q: string
}): MyFileFilters {
  const purpose = FILE_TABS.find((entry) => entry.id === tab)?.purpose
  const type = FILE_TYPE_OPTIONS.find((entry) => entry.id === typeOption)?.type
  return {
    ...(purpose ? { purpose } : {}),
    ...(type ? { type } : {}),
    ...(q ? { q } : {}),
  }
}
