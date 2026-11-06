"use client"

import { SaveBar as SharedSaveBar } from "@ihsp/ui"
import { useNotebookErrorMessage } from "../../lib/use-notebook-error"

type SaveBarProps = {
  dirty: boolean
  saving: boolean
  error: unknown
  onSave: () => void
  onDiscard: () => void
}

/** The shared save bar with the notebook wording of a failed save (PUT slides). */
export function SaveBar({ error, ...props }: SaveBarProps) {
  const errorMessage = useNotebookErrorMessage()
  return <SharedSaveBar {...props} error={error ? errorMessage(error) : null} />
}
