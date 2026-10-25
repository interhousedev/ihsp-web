"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useId, useState } from "react"
import { useRenameArtifact } from "../../api/use-artifacts"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"

const MAX_TITLE_LENGTH = 120

type RenameArtifactDialogProps = {
  notebookId: string
  artifactId: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Rename" from the item menu of a viewer: one text field and Save. */
export function RenameArtifactDialog({ open, onOpenChange, ...form }: RenameArtifactDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <RenameForm {...form} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/** Mounted only while the dialog is open, so every opening starts with the current title and no old error. */
function RenameForm({
  notebookId,
  artifactId,
  title,
  onClose,
}: Omit<RenameArtifactDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const t = useT("notebooks")
  const common = useT()
  const errorMessage = useNotebookErrorMessage()
  const inputId = useId()
  const rename = useRenameArtifact(notebookId)
  const [value, setValue] = useState(title)
  const trimmed = value.trim()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed === "") return
        rename.mutate({ id: artifactId, title: trimmed }, { onSuccess: onClose })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("card.rename")}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId}>{t("viewers.titleLabel")}</Label>
        <Input
          id={inputId}
          value={value}
          maxLength={MAX_TITLE_LENGTH}
          className="min-h-11"
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      {rename.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(rename.error)}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
          {common("common.cancel")}
        </Button>
        <Button type="submit" className="min-h-11" disabled={rename.isPending || trimmed === ""}>
          {common("common.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
