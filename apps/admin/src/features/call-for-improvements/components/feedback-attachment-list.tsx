"use client"

import type { AdminFeedbackAttachment } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { formatBytes } from "@ihsp/ui"

/** The files of a feedback item or reply: images with a preview, every file with a download link. */
export function FeedbackAttachmentList({ attachments }: { attachments: readonly AdminFeedbackAttachment[] }) {
  const t = useT("callForImprovements")
  if (attachments.length === 0) return <p className="text-muted-foreground text-sm">{t("detail.noAttachments")}</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {attachments.map((file) => (
        <li key={file.file_id} className="flex gap-3 rounded-lg border p-2">
          {file.mime.startsWith("image/") ? <ImagePreview file={file} /> : null}
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{file.name}</span>
            <span className="text-muted-foreground text-xs">{formatBytes(file.size)}</span>
            <DownloadLink file={file} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function ImagePreview({ file }: { file: AdminFeedbackAttachment }) {
  const t = useT("callForImprovements")
  return (
    <img
      src={file.download_url}
      alt={t("detail.preview", { name: file.name })}
      className="size-16 shrink-0 rounded object-cover"
    />
  )
}

function DownloadLink({ file }: { file: AdminFeedbackAttachment }) {
  const t = useT("callForImprovements")
  const label = t("detail.download", { name: file.name })
  return (
    <a
      href={file.download_url}
      download={file.name}
      aria-label={label}
      className="inline-flex min-h-11 w-fit items-center gap-1 text-sm underline-offset-4 hover:underline md:min-h-8"
    >
      <Icons.paperclip aria-hidden className="size-4" />
      {label}
    </a>
  )
}
