import { resolveFileUrl, type FileItem } from "@ihsp/api"
import { opensInline } from "./format-bytes"

/** Opens a file in a new tab through a presigned URL (valid for 60 seconds). */
export async function openFile(file: FileItem): Promise<void> {
  const url = await resolveFileUrl(file.id, opensInline(file.content_type))
  window.open(url, "_blank", "noopener,noreferrer")
}
