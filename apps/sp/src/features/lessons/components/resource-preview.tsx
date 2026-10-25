"use client"

import { getFileUrlQuery, type FileItem } from "@ihsp/api"
import { SourceFileDialog, previewKindOf } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconEye } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

/** Presigned links live 60 seconds; ask again after half of it. */
const URL_STALE_MS = 30_000

/** True for files the preview window can show (images, PDFs, video and audio). */
export function canPreview(file: FileItem | null): file is FileItem {
  return file !== null && previewKindOf(file) !== "card"
}

/** "Preview" of a lesson material: the notebooks' file preview window over an inline link of the file. */
export function ResourcePreview({ file, title }: { file: FileItem; title: string }) {
  const t = useT("lesson.resources")
  const [open, setOpen] = useState(false)
  const url = useQuery({
    ...getFileUrlQuery(file.id, { disposition: "inline" }),
    enabled: open,
    staleTime: URL_STALE_MS,
    // A new link would restart a playing video or a scrolled PDF; the open dialog keeps the first one.
    refetchOnWindowFocus: false,
  })
  if (open && url.isError) setOpen(false)
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 md:size-8"
        aria-label={t("previewItem", { title })}
        title={t("preview")}
        disabled={open && url.isPending}
        onClick={() => setOpen(true)}
      >
        <IconEye aria-hidden />
      </Button>
      {open && url.data ? (
        <SourceFileDialog kind={previewKindOf(file)} file={file} url={url.data.url} open onOpenChange={setOpen} />
      ) : null}
    </>
  )
}
