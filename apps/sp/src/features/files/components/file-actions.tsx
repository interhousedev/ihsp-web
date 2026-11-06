"use client"

import type { FileItem } from "@ihsp/api"
import { AddToNotebookMenu, FileDownloadButton, FileShareMenu } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconDots,
  IconNotebook,
  IconPencil,
  IconTrash,
} from "@ihsp/ui"
import { fileAddress } from "../utils/open-file"

type FileActionsProps = {
  file: FileItem
  onShare?: (file: FileItem) => void
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

/** The actions of one file: download, share and add to a notebook as icon buttons; rename and delete in "More actions". */
export function FileActions({ file, onShare, onRename, onDelete }: FileActionsProps) {
  const t = useT("files.row")
  const tNotebook = useT("assistant.addToNotebook")
  const usable = file.status === "ready"
  // A notebook can only read a file that has extracted text.
  const hasText = usable && file.text_bytes !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {usable ? <FileDownloadButton resolve={() => fileAddress(file)} /> : null}
      {usable ? (
        <FileShareMenu fileId={file.id} name={file.name} {...(onShare ? { onPeople: () => onShare(file) } : {})} />
      ) : null}
      {hasText ? (
        <AddToNotebookMenu
          input={{ kind: "file", file_id: file.id }}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              aria-label={tNotebook("itemLabel", { title: file.name })}
              title={tNotebook("title")}
            >
              <IconNotebook aria-hidden />
            </Button>
          }
        />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 md:size-8"
              aria-label={t("more", { name: file.name })}
            />
          }
        >
          <IconDots aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={file.status === "rejected"} onClick={() => onRename(file)}>
            <IconPencil aria-hidden />
            {t("renameShort")}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(file)}>
            <IconTrash aria-hidden />
            {t("deleteShort")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
