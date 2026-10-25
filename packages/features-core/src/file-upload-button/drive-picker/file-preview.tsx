"use client"

import type { FileItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { fileKindOf, formatFileSize } from "./file-kind"
import { FileKindIcon, useInlineUrl } from "./file-visual"

/**
 * Preview pane of the picker: an image as a thumbnail; every other file (PDF, slides, sheets, video, text) as its type
 * icon, with the name, size, type and date.
 */
export function FilePreview({ file }: { file: FileItem }) {
  const t = useT("files.drive")
  const format = useFormatters()
  const isImage = fileKindOf(file) === "image"
  const url = useInlineUrl(file.id, isImage)
  return (
    <div className="flex min-h-0 flex-col gap-3" data-testid="drive-preview">
      <div className="bg-muted text-muted-foreground flex aspect-[4/3] max-h-48 w-full items-center justify-center overflow-hidden rounded-lg border md:max-h-none">
        {isImage && url ? (
          <img src={url} alt={file.name} className="size-full object-contain" />
        ) : (
          <FileKindIcon file={file} className="size-12" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium" title={file.name}>
          {file.name}
        </p>
        <dl className="text-muted-foreground mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
          <dt>{t("size")}</dt>
          <dd>{formatFileSize(file.byte_size)}</dd>
          <dt>{t("kind")}</dt>
          <dd className="truncate">{file.content_type}</dd>
          <dt>{t("added")}</dt>
          <dd>{format.dateTime(new Date(file.created_at))}</dd>
        </dl>
      </div>
    </div>
  )
}
