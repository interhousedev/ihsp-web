"use client"

import type { FileItem as ApiFile } from "@ihsp/api"
import { FileItem, FileThumb } from "@ihsp/features-core"
import { useFormatters } from "@ihsp/i18n"
import { Card } from "@ihsp/ui"
import { formatBytes } from "../utils/format-bytes"
import { FileActions } from "./file-actions"
import { FileStatusBadge } from "./file-status-badge"
import { FileTitle } from "./file-title"
import { UsedByList } from "./used-by-list"

type FileCardProps = {
  file: ApiFile
  onShare?: (file: ApiFile) => void
  onRename: (file: ApiFile) => void
  onDelete: (file: ApiFile) => void
}

/** A file in the grid: the shared file row as the header, then the thumbnail (or a large type icon) and the actions. */
export function FileCard({ file, onShare, onRename, onDelete }: FileCardProps) {
  const format = useFormatters()
  return (
    <Card data-file-id={file.id} id={`file-${file.id}`} className="gap-0 overflow-hidden p-0">
      <FileItem
        className="rounded-none border-0 border-b"
        name={file.name}
        contentType={file.content_type}
        title={<FileTitle file={file} className="truncate" />}
      />
      <FileThumb file={file} className="aspect-[4/3] w-full" />
      <div className="flex flex-col gap-2 p-3">
        <FileStatusBadge file={file} />
        <p className="text-muted-foreground truncate text-xs">
          {formatBytes(file.byte_size)} · {format.date(file.created_at)}
        </p>
        <UsedByList items={file.used_by} />
        <FileActions file={file} {...(onShare ? { onShare } : {})} onRename={onRename} onDelete={onDelete} />
      </div>
    </Card>
  )
}
