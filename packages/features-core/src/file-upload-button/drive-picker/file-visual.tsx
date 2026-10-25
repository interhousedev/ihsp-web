"use client"

import { getFileUrlQuery, type FileItem } from "@ihsp/api"
import {
  IconFile,
  IconFileText,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconFileTypeXls,
  IconPhoto,
  IconPresentation,
  IconVideo,
  cn,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { fileKindOf, type FileKind } from "./file-kind"

const ICONS = {
  image: IconPhoto,
  video: IconVideo,
  pdf: IconFileTypePdf,
  slides: IconPresentation,
  sheet: IconFileTypeXls,
  doc: IconFileTypeDoc,
  text: IconFileText,
  other: IconFile,
} as const satisfies Record<FileKind, unknown>

/** The icon of a file type. */
export function FileKindIcon({ file, className }: { file: Pick<FileItem, "content_type">; className?: string }) {
  const Icon = ICONS[fileKindOf(file)]
  return <Icon aria-hidden className={cn("size-5 shrink-0", className)} />
}

/** A signed inline URL of a file, for thumbnails and the preview. Off until `enabled`. */
export function useInlineUrl(id: string, enabled: boolean): string | null {
  const query = useQuery({ ...getFileUrlQuery(id, { disposition: "inline" }), enabled, staleTime: 30_000 })
  return query.data?.url ?? null
}

/** Image thumbnail, or the type icon for everything else (no server thumbnails exist for PDF or video). */
export function FileThumb({ file, className }: { file: FileItem; className?: string }) {
  const isImage = fileKindOf(file) === "image"
  const url = useInlineUrl(file.id, isImage)
  return (
    <div className={cn("bg-muted text-muted-foreground flex items-center justify-center overflow-hidden", className)}>
      {isImage && url ? (
        <img src={url} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <FileKindIcon file={file} className="size-7" />
      )}
    </div>
  )
}
