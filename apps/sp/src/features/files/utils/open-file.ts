import { resolveFileUrl, type FileItem } from "@ihsp/api"
import { opensInline } from "./format-bytes"

/** The fresh address of a file: PDFs and images open in the browser, everything else downloads (FILE-3). */
export function fileAddress(file: FileItem): Promise<string> {
  return resolveFileUrl(file.id, opensInline(file.content_type))
}

/** Where a file lives in the list (its card anchor); the title link opens the file itself on click. */
export function fileHref(fileId: string): string {
  return `/files/#file-${fileId}`
}
