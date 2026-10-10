"use client"

import type { FileItem } from "@ihsp/api"
import { AddToNotebookMenu } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Card, CardContent } from "@ihsp/ui"
import { IconDownload, IconFile, IconNotebook, IconPencil, IconTrash } from "@ihsp/ui"
import { toast } from "sonner"
import { formatBytes } from "../utils/format-bytes"
import { fileHref, openFile } from "../utils/open-file"
import { FileStatusBadge } from "./file-status-badge"
import { UsedByList } from "./used-by-list"

type FileRowProps = {
  file: FileItem
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

/** A file as a card that works at 360 px and on desktop: name, details, status, usage and actions. */
export function FileRow({ file, onRename, onDelete }: FileRowProps) {
  const t = useT("files.row")
  const tNotebook = useT("assistant.addToNotebook")
  const format = useFormatters()
  const usable = file.status === "ready"
  // A notebook can only read a file that has extracted text.
  const hasText = usable && file.text_bytes !== null

  async function download() {
    try {
      await openFile(file)
    } catch {
      toast.error(t("downloadFailed"))
    }
  }

  return (
    <Card data-file-id={file.id} id={`file-${file.id}`}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <IconFile className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium break-words">
              {usable ? (
                <a
                  href={fileHref(file.id)}
                  className="hover:underline"
                  onClick={(event) => {
                    event.preventDefault()
                    void download()
                  }}
                >
                  {file.name}
                </a>
              ) : (
                file.name
              )}
            </h3>
            <p className="text-muted-foreground text-xs">
              {file.content_type} · {formatBytes(file.byte_size)} · {format.date(file.created_at)}
            </p>
          </div>
          <FileStatusBadge file={file} />
        </div>
        <UsedByList items={file.used_by} />
        <div className="flex flex-wrap gap-2">
          {usable ? (
            <Button type="button" variant="outline" className="min-h-11" onClick={() => void download()}>
              <IconDownload aria-hidden />
              {t("download")}
            </Button>
          ) : null}
          {hasText ? (
            <AddToNotebookMenu
              input={{ kind: "file", file_id: file.id }}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  aria-label={tNotebook("itemLabel", { title: file.name })}
                >
                  <IconNotebook aria-hidden />
                  {tNotebook("title")}
                </Button>
              }
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={file.status === "rejected"}
            aria-label={t("rename", { name: file.name })}
            onClick={() => onRename(file)}
          >
            <IconPencil aria-hidden />
            {t("renameShort")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            aria-label={t("delete", { name: file.name })}
            onClick={() => onDelete(file)}
          >
            <IconTrash aria-hidden />
            {t("deleteShort")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
