"use client"

import type { SourceFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@ihsp/ui"
import { SourcePdfView } from "./source-pdf-view"
import type { PreviewKind } from "./source-file-preview"

export type SourceFileDialogProps = {
  /** Set for a notebook source (its PDF link is renewed through the notebook API). */
  notebookId?: string
  sourceId?: string
  kind: PreviewKind
  file: SourceFile
  url: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The full preview of an uploaded source: a lightbox for an image, the PDF (browser viewer, or its first page where there is none), a video
 * or audio player. Loaded lazily by `SourceFilePreview` when it is opened the first time.
 */
export function SourceFileDialog({ notebookId, sourceId, kind, file, url, open, onOpenChange }: SourceFileDialogProps) {
  const t = useT("notebooks")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-2 p-2 sm:max-w-[min(96vw,80rem)] sm:p-3">
        <DialogTitle className="truncate pr-10 text-sm">{file.name}</DialogTitle>
        <DialogDescription className="sr-only">{t("viewer.filePreview.label")}</DialogDescription>
        <div className="bg-muted flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg">
          {kind === "image" ? (
            <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
          ) : kind === "pdf" ? (
            <SourcePdfView notebookId={notebookId} sourceId={sourceId} name={file.name} url={url} size="full" />
          ) : kind === "video" ? (
            <video src={url} controls autoPlay preload="metadata" className="max-h-full w-full bg-black">
              <track kind="captions" />
              {t("viewer.filePreview.unsupported")}
            </video>
          ) : (
            <audio src={url} controls autoPlay preload="metadata" className="w-full max-w-xl px-4">
              <track kind="captions" />
              {t("viewer.filePreview.unsupported")}
            </audio>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
