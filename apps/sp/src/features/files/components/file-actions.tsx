"use client"

import type { FileItem } from "@ihsp/api"
import { AddToNotebookMenu } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconDots,
  IconDownload,
  IconLink,
  IconNotebook,
  IconPencil,
  IconTrash,
} from "@ihsp/ui"
import { toast } from "sonner"
import { useShareFile } from "../hooks/use-my-files"
import { openFile } from "../utils/open-file"

type FileActionsProps = {
  file: FileItem
  onRename: (file: FileItem) => void
  onDelete: (file: FileItem) => void
}

/** Copies the link; false when the browser cannot write to the clipboard. */
async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

/**
 * The actions of one file: download and add to a notebook as icon buttons; share, rename and delete in the
 * "More actions" menu. Share makes a short link to the file (`POST /v1/links`) and copies it.
 */
export function FileActions({ file, onRename, onDelete }: FileActionsProps) {
  const t = useT("files.row")
  const tNotebook = useT("assistant.addToNotebook")
  const errorMessage = useErrorMessage()
  const share = useShareFile()
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

  function shareFile() {
    share.mutate(file.id, {
      onSuccess: async (link) => {
        if (await copyLink(link.url)) toast.success(t("linkCopied"))
        else toast.success(link.url)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {usable ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("download")}
          title={t("download")}
          onClick={() => void download()}
        >
          <IconDownload aria-hidden />
        </Button>
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
          {usable ? (
            <DropdownMenuItem disabled={share.isPending} onClick={shareFile}>
              <IconLink aria-hidden />
              {t("share")}
            </DropdownMenuItem>
          ) : null}
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
