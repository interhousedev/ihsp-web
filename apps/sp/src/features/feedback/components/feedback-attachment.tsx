"use client"

import type { FeedbackAttachment } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

/** One file of a report or of a response: images are shown as thumbnails, other files as a link. */
export function FeedbackAttachmentView({ attachment }: { attachment: FeedbackAttachment }) {
  const t = useT("feedback")
  const isImage = attachment.mime.startsWith("image/")
  if (isImage) {
    return (
      <img src={attachment.download_url} alt={attachment.name} className="size-24 rounded-md border object-cover" />
    )
  }
  return (
    <a
      href={attachment.download_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex min-h-11 items-center text-sm underline underline-offset-4"
    >
      {attachment.name || t("page.openFile")}
    </a>
  )
}

/** The attachments of a report or a response, wrapped so they break onto new lines on a phone. */
export function FeedbackAttachmentList({ attachments }: { attachments: readonly FeedbackAttachment[] }) {
  if (attachments.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <li key={attachment.file_id}>
          <FeedbackAttachmentView attachment={attachment} />
        </li>
      ))}
    </ul>
  )
}
