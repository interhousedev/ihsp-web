"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useId, useState } from "react"
import { useRenameArtifact } from "../api/use-artifacts"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

const MAX_TITLE_LENGTH = 120

export type RenameArtifactDialogProps = {
  notebookId: string
  item: ArtifactItem
  /** Title shown while the item has none of its own. */
  fallbackTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Rename an item of the Studio list (`PATCH …/artifacts/{id}`). */
export function RenameArtifactDialog({
  notebookId,
  item,
  fallbackTitle,
  open,
  onOpenChange,
}: RenameArtifactDialogProps) {
  const t = useT("notebooks.studio")
  const root = useT()
  const errorMessage = useNotebookErrorMessage()
  const rename = useRenameArtifact(notebookId)
  const inputId = useId()
  const [title, setTitle] = useState(item.title || fallbackTitle)
  const trimmed = title.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed === "") return
            rename.mutate({ id: item.id, title: trimmed }, { onSuccess: () => onOpenChange(false) })
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("renameTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={inputId}>{t("renameLabel")}</Label>
            <Input
              id={inputId}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              className="min-h-11"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          {rename.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(rename.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {root("common.cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={rename.isPending || trimmed === ""}>
              {root("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
