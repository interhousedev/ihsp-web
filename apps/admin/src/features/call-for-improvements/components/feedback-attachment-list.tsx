"use client"

import type { AdminFeedbackAttachment } from "@ihsp/api"
import { FileItem, fileLinkProps } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { IconDownload, buttonVariants, cn, formatBytes } from "@ihsp/ui"

/** The files of a feedback item or reply: the shared file row with a preview of images and a download link. */
export function FeedbackAttachmentList({ attachments }: { attachments: readonly AdminFeedbackAttachment[] }) {
  const t = useT("callForImprovements")
  if (attachments.length === 0) return <p className="text-muted-foreground text-sm">{t("detail.noAttachments")}</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {attachments.map((file) => (
        <FileItem
          as="li"
          key={file.file_id}
          name={file.name}
          contentType={file.mime}
          thumbnailUrl={file.mime.startsWith("image/") ? file.download_url : null}
          thumbnailAlt={t("detail.preview", { name: file.name })}
          meta={[formatBytes(file.size)]}
          actions={
            <a
              {...fileLinkProps(file.download_url)}
              download={file.name}
              aria-label={t("detail.download", { name: file.name })}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-11 md:size-8")}
            >
              <IconDownload aria-hidden />
            </a>
          }
        />
      ))}
    </ul>
  )
}
