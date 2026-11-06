"use client"

import type { FeedbackAttachment } from "@ihsp/api"
import { FileItem, FileOpenLink } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { formatBytes } from "@ihsp/ui"

/** One file of a report or of a response. */
export function FeedbackAttachmentView({ attachment }: { attachment: FeedbackAttachment }) {
  const t = useT("feedback")
  const name = attachment.name || t("page.openFile")
  return (
    <FileItem
      name={name}
      contentType={attachment.mime}
      thumbnailUrl={attachment.mime.startsWith("image/") ? attachment.download_url : null}
      meta={[formatBytes(attachment.size)]}
      actions={<FileOpenLink href={attachment.download_url} title={name} />}
    />
  )
}

/** The attachments of a report or a response. */
export function FeedbackAttachmentList({ attachments }: { attachments: readonly FeedbackAttachment[] }) {
  if (attachments.length === 0) return null
  return (
    <ul className="flex flex-col gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.file_id}>
          <FeedbackAttachmentView attachment={attachment} />
        </li>
      ))}
    </ul>
  )
}
