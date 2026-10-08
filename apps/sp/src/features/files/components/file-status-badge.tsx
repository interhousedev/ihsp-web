"use client"

import type { FileItem } from "@ihsp/api"
import { useRejectReason } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Types the backend extracts text from; if no text came out, the assistant cannot read the file. */
const TEXT_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
])

/** "Checking…", the reject reason, "Ready for assistant" or "Too large for assistant" (UF-WEB-18). */
export function FileStatusBadge({ file }: { file: FileItem }) {
  const t = useT("files.status")
  const rejectReason = useRejectReason()
  if (file.status === "pending" || file.status === "processing") {
    return <Badge variant="outline">{t("checking")}</Badge>
  }
  if (file.status === "rejected") {
    return <Badge variant="destructive">{t("rejected", { reason: rejectReason(file.reject_reason) })}</Badge>
  }
  if (file.assistant_ready) return <Badge variant="secondary">{t("assistantReady")}</Badge>
  if (file.text_bytes !== null) return <Badge variant="outline">{t("assistantTooLarge")}</Badge>
  if (TEXT_TYPES.has(file.content_type)) return <Badge variant="outline">{t("assistantUnreadable")}</Badge>
  return null
}
