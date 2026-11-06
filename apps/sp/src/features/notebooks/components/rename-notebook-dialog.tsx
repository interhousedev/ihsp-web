"use client"

import type { NotebookItem } from "@ihsp/api"
import { RenameNotebookForm } from "./rename-notebook-form"

type RenameNotebookDialogProps = {
  notebook: NotebookItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Rename from a card's menu. */
export function RenameNotebookDialog({ notebook, open, onOpenChange }: RenameNotebookDialogProps) {
  return <RenameNotebookForm notebook={notebook} open={open} onOpenChange={onOpenChange} />
}
