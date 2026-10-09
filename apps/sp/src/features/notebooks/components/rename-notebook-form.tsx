"use client"

import type { NotebookItem } from "@ihsp/api"
import { useNotebookErrorMessage, useUpdateNotebook } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useId, useState } from "react"

const TITLE_MAX = 200

type RenameNotebookFormProps = {
  notebook: NotebookItem
  onDone: () => void
}

/** The form inside the Rename dialog; it mounts with the dialog, so it always starts from the current title. */
export function RenameNotebookForm({ notebook, onDone }: RenameNotebookFormProps) {
  const t = useT("notebooks")
  const common = useT("common")
  const errorMessage = useNotebookErrorMessage()
  const update = useUpdateNotebook(notebook.id)
  const inputId = useId()
  const [title, setTitle] = useState(notebook.title)
  const trimmed = title.trim()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed === "") return
        if (trimmed === notebook.title) onDone()
        else update.mutate({ title: trimmed }, { onSuccess: onDone })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("rename.title")}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId}>{t("rename.label")}</Label>
        <Input
          id={inputId}
          value={title}
          maxLength={TITLE_MAX}
          className="min-h-11"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      {update.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(update.error)}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onDone}>
          {common("cancel")}
        </Button>
        <Button type="submit" className="min-h-11" disabled={update.isPending || trimmed === ""}>
          {common("save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
