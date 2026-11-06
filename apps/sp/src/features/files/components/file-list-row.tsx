"use client"

import type { FileItem as ApiFile } from "@ihsp/api"
import { FileItem } from "@ihsp/features-core"
import { useFormatters } from "@ihsp/i18n"
import { formatBytes } from "../utils/format-bytes"
import { FileActions } from "./file-actions"
import { FileStatusBadge } from "./file-status-badge"
import { FileTitle } from "./file-title"
import { UsedByList } from "./used-by-list"

type FileListRowProps = {
  file: ApiFile
  onShare?: (file: ApiFile) => void
  onRename: (file: ApiFile) => void
  onDelete: (file: ApiFile) => void
}

/** A file in the list view: the shared file row with status, where it is used and its actions. */
export function FileListRow({ file, onShare, onRename, onDelete }: FileListRowProps) {
  const format = useFormatters()
  return (
    <FileItem
      data-file-id={file.id}
      id={`file-${file.id}`}
      name={file.name}
      contentType={file.content_type}
      title={<FileTitle file={file} />}
      badge={<FileStatusBadge file={file} />}
      meta={[file.content_type, formatBytes(file.byte_size), format.date(file.created_at)]}
      details={<UsedByList items={file.used_by} />}
      actions={<FileActions file={file} {...(onShare ? { onShare } : {})} onRename={onRename} onDelete={onDelete} />}
    />
  )
}
