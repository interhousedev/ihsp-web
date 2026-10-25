"use client"

import type { NotebookItem } from "@ihsp/api"
import { Dialog, DialogContent } from "@ihsp/ui"
import { RenameNotebookForm } from "./rename-notebook-form"

type RenameNotebookDialogProps = {
  notebook: NotebookItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Rename from a card's menu. */
export function RenameNotebookDialog({ notebook, open, onOpenChange }: RenameNotebookDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <RenameNotebookForm notebook={notebook} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
