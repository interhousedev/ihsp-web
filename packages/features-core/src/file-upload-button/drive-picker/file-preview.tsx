"use client"

import type { FileItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { fileKindOf, formatFileSize } from "./file-kind"
import { FileKindIcon, useInlineUrl } from "./file-visual"

/** Preview pane: the image, the first page of a PDF or the video poster; metadata for everything else. */
export function FilePreview({ file }: { file: FileItem }) {
  const t = useT("files.drive")
  const format = useFormatters()
  const kind = fileKindOf(file)
  const url = useInlineUrl(file.id, kind === "image" || kind === "pdf" || kind === "video")
  return (
    <div className="flex min-h-0 flex-col gap-3" data-testid="drive-preview">
      <div className="bg-muted flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border">
        {kind === "image" && url ? <img src={url} alt={file.name} className="size-full object-contain" /> : null}
        {kind === "pdf" && url ? (
          <iframe title={file.name} src={`${url}#page=1&toolbar=0&navpanes=0`} className="size-full" />
        ) : null}
        {kind === "video" && url ? (
          <video src={`${url}#t=0.1`} preload="metadata" muted playsInline className="size-full object-contain" />
        ) : null}
        {!url || (kind !== "image" && kind !== "pdf" && kind !== "video") ? (
          <FileKindIcon file={file} className="text-muted-foreground size-12" />
        ) : null}
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
