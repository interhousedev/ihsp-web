"use client"

import type { NotebookItem } from "@ihsp/api"
import { useDeleteNotebook, useNotebookErrorMessage, useUpdateNotebook } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconDotsVertical } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { RenameNotebookDialog } from "./rename-notebook-dialog"

/** The ⋮ menu of a card: Pin or Unpin, Rename, Delete (with a confirmation). */
export function NotebookCardMenu({ notebook }: { notebook: NotebookItem }) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const update = useUpdateNotebook(notebook.id)
  const remove = useDeleteNotebook()
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground absolute end-1 top-1 size-11 md:size-9"
              aria-label={t("card.menu", { title: notebook.title })}
            />
          }
        >
          <IconDotsVertical aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="min-h-11 md:min-h-8"
            onClick={() =>
              update.mutate({ pinned: !notebook.pinned }, { onError: (error) => toast.error(errorMessage(error)) })
            }
          >
            {notebook.pinned ? t("card.unpin") : t("card.pin")}
          </DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={() => setRenaming(true)}>
            {t("card.rename")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-8" onClick={() => setDeleting(true)}>
            {t("card.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameNotebookDialog notebook={notebook} open={renaming} onOpenChange={setRenaming} />

      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => {
          setDeleting(open)
          if (!open) remove.reset()
        }}
        title={t("delete.title")}
        description={t("delete.description")}
        confirmLabel={t("card.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate(notebook.id, { onSuccess: () => setDeleting(false) })}
      >
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(remove.error)}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
