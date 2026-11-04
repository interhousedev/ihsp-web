"use client"

import type { FileItem } from "@ihsp/api"
import { FileKindIcon, FileThumb } from "@ihsp/features-core"
import { useFormatters } from "@ihsp/i18n"
import { Card } from "@ihsp/ui"
import { formatBytes } from "../utils/format-bytes"
import { FileActions } from "./file-actions"
import { FileStatusBadge } from "./file-status-badge"
import { FileTitle } from "./file-title"
import { UsedByList } from "./used-by-list"

type FileCardProps = {
  file: FileItem
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

/** A file in the grid: file-type icon and name as the header, the thumbnail (or a large type icon) and the actions. */
export function FileCard({ file, onRename, onDelete }: FileCardProps) {
  const format = useFormatters()
  return (
    <Card data-file-id={file.id} id={`file-${file.id}`} className="gap-0 overflow-hidden p-0">
      <div className="flex min-w-0 items-center gap-2 border-b px-3 py-2">
        <FileKindIcon file={file} className="text-muted-foreground size-4" />
        <FileTitle file={file} className="min-w-0 flex-1 truncate" />
      </div>
      <FileThumb file={file} className="aspect-[4/3] w-full" />
      <div className="flex flex-col gap-2 p-3">
        <FileStatusBadge file={file} />
        <p className="text-muted-foreground truncate text-xs">
          {formatBytes(file.byte_size)} · {format.date(file.created_at)}
        </p>
        <UsedByList items={file.used_by} />
        <FileActions file={file} onRename={onRename} onDelete={onDelete} />
      </div>
    </Card>
  )
}
