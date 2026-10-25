"use client"

import { getNotebookSourceFileUrlQuery, type SourceFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Skeleton, cn } from "@ihsp/ui"
import { IconArrowsMaximize, IconDownload } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { Suspense, lazy, useId, useState } from "react"
import { fileKindOf, type FileKind } from "../../file-upload-button/drive-picker/file-kind"
import { FileKindIcon } from "../../file-upload-button/drive-picker/file-visual"
import { SourcePdfView } from "./source-pdf-view"
import { useFormatBytes } from "./use-format-bytes"

// The full-size viewer (lightbox, PDF frame, player) is loaded only when it is opened.
const SourceFileDialog = lazy(() => import("./source-file-dialog").then((m) => ({ default: m.SourceFileDialog })))

/** Presigned links live 60 seconds; ask again after half of it. */
const URL_STALE_MS = 30_000

export type SourceFilePreviewProps = {
  notebookId: string
  sourceId: string
  file: SourceFile
}

/** What the preview window shows for a file kind; `audio` is a `FileKind` "other" with an `audio/*` content type. */
export type PreviewKind = "image" | "pdf" | "video" | "audio" | "card"

export function previewKindOf(file: SourceFile): PreviewKind {
  if (file.content_type.toLowerCase().startsWith("audio/")) return "audio"
  const kind: FileKind = fileKindOf(file)
  return kind === "image" || kind === "pdf" || kind === "video" ? kind : "card"
}

/** A signed URL of the file behind a source (`inline` for the preview, `attachment` for Download). Off until `enabled`. */
export function useSourceFileUrl(
  notebookId: string,
  sourceId: string,
  disposition: "inline" | "attachment",
  enabled = true,
): string | null {
  const query = useQuery({
    ...getNotebookSourceFileUrlQuery(notebookId, sourceId, { disposition }),
    enabled,
    staleTime: URL_STALE_MS,
  })
  return query.data?.url ?? null
}

/**
 * The preview window of an uploaded source, above the source guide: an image (click to zoom), the PDF, a video or
 * audio player, or a file card for documents the browser cannot show. Under it "Open full preview" and "Download".
 * On phones it is full width and at most ~40vh tall.
 */
export function SourceFilePreview({ notebookId, sourceId, file }: SourceFilePreviewProps) {
  const t = useT("notebooks")
  const formatBytes = useFormatBytes()
  const labelId = useId()
  const kind = previewKindOf(file)
  const viewable = kind !== "card"
  const [open, setOpen] = useState(false)
  const inlineUrl = useSourceFileUrl(notebookId, sourceId, "inline", viewable)
  const downloadUrl = useSourceFileUrl(notebookId, sourceId, "attachment")

  return (
    <section aria-labelledby={labelId} className="bg-card flex flex-col gap-3 rounded-xl border p-3">
      <h3 id={labelId} className="sr-only">
        {t("viewer.filePreview.label")}
      </h3>
      <div
        className={cn(
          "bg-muted text-muted-foreground flex w-full items-center justify-center overflow-hidden rounded-lg",
          kind !== "card" && kind !== "audio" && "max-h-[40vh] min-h-32",
        )}
      >
        {viewable && !inlineUrl ? (
          <Skeleton className={cn("w-full", kind === "audio" ? "h-14" : "h-48")} />
        ) : (
          <PreviewWindow
            notebookId={notebookId}
            sourceId={sourceId}
            kind={kind}
            file={file}
            url={inlineUrl}
            onZoom={() => setOpen(true)}
          />
        )}
      </div>
      {kind === "card" ? null : (
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
      )}
      {kind === "card" ? (
        <FileCard file={file} size={formatBytes(file.byte_size)} />
      ) : (
        <p className="text-muted-foreground truncate text-xs">
          {formatBytes(file.byte_size)} · {file.content_type}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {viewable ? (
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
            <IconArrowsMaximize aria-hidden />
            {t("viewer.filePreview.open")}
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!downloadUrl}
          render={<a href={downloadUrl ?? undefined} download={file.name} rel="noopener" />}
        >
          <IconDownload aria-hidden />
          {t("viewer.filePreview.download")}
        </Button>
      </div>
      {open && inlineUrl ? (
        <Suspense fallback={null}>
          <SourceFileDialog
            notebookId={notebookId}
            sourceId={sourceId}
            kind={kind}
            file={file}
            url={inlineUrl}
            open={open}
            onOpenChange={setOpen}
          />
        </Suspense>
      ) : null}
    </section>
  )
}

function PreviewWindow({
  notebookId,
  sourceId,
  kind,
  file,
  url,
  onZoom,
}: {
  notebookId: string
  sourceId: string
  kind: PreviewKind
  file: SourceFile
  url: string | null
  onZoom: () => void
}) {
  const t = useT("notebooks")
  if (!url) return <FileKindIcon file={file} className="size-12" />
  switch (kind) {
    case "image":
      return (
        <button
          type="button"
          className="focus-visible:ring-ring flex w-full cursor-zoom-in items-center justify-center rounded-lg outline-hidden focus-visible:ring-2"
          aria-label={t("viewer.filePreview.zoom", { name: file.name })}
          onClick={onZoom}
        >
          <img src={url} alt={file.name} loading="lazy" className="max-h-[40vh] w-full object-contain" />
        </button>
      )
    case "pdf":
      return <SourcePdfView notebookId={notebookId} sourceId={sourceId} name={file.name} url={url} size="compact" />
    case "video":
      return (
        <video src={url} controls preload="metadata" className="max-h-[40vh] w-full bg-black">
          <track kind="captions" />
          {t("viewer.filePreview.unsupported")}
        </video>
      )
    case "audio":
      return (
        <audio src={url} controls preload="metadata" className="w-full">
          <track kind="captions" />
          {t("viewer.filePreview.unsupported")}
        </audio>
      )
    default:
      return <FileKindIcon file={file} className="size-12" />
  }
}

/** Documents the browser cannot show (DOCX, XLSX, PPTX, TXT…): the type icon with name, size and type. */
function FileCard({ file, size }: { file: SourceFile; size: string }) {
  const t = useT("notebooks")
  return (
    <div className="flex min-w-0 items-center gap-3">
      <FileKindIcon file={file} className="text-muted-foreground size-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <dl className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
          <div className="flex gap-1">
            <dt>{t("viewer.filePreview.size")}:</dt>
            <dd>{size}</dd>
          </div>
          <div className="flex min-w-0 gap-1">
            <dt>{t("viewer.filePreview.type")}:</dt>
            <dd className="truncate">{file.content_type}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
