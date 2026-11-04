"use client"

import type { FileItem } from "@ihsp/api"
import { FileKindIcon } from "@ihsp/features-core"
import { useFormatters } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { formatBytes } from "../utils/format-bytes"
import { FileActions } from "./file-actions"
import { FileStatusBadge } from "./file-status-badge"
import { FileTitle } from "./file-title"
import { UsedByList } from "./used-by-list"

type FileListRowProps = {
  file: FileItem
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

/** A file in the list view: type icon, name and details, status and actions; stacks on a phone. */
export function FileListRow({ file, onRename, onDelete }: FileListRowProps) {
  const format = useFormatters()
  return (
    <Card data-file-id={file.id} id={`file-${file.id}`} className="py-0">
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <FileKindIcon file={file} className="text-muted-foreground mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <FileTitle file={file} />
            <p className="text-muted-foreground text-xs">
              {file.content_type} · {formatBytes(file.byte_size)} · {format.date(file.created_at)}
            </p>
            <UsedByList items={file.used_by} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <FileStatusBadge file={file} />
          <FileActions file={file} onRename={onRename} onDelete={onDelete} />
        </div>
      </CardContent>
    </Card>
  )
}
