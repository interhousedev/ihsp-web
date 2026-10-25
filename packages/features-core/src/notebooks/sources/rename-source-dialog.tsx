"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

const MAX_TITLE_LENGTH = 200

type RenameSourceDialogProps = {
  source: SourceItem | null
  pending: boolean
  error: unknown
  onClose: () => void
  onSave: (source: SourceItem, title: string) => void
}

/** Rename a source (the title that rows, citations and the viewer show). */
export function RenameSourceDialog({ source, pending, error, onClose, onSave }: RenameSourceDialogProps) {
  const t = useT("notebooks")
  const errorMessage = useNotebookErrorMessage()
  const inputId = useId()
  const [title, setTitle] = useState("")

  useEffect(() => {
    setTitle(source?.title ?? "")
  }, [source])

  const trimmed = title.trim()

  return (
    <Dialog open={source !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (source && trimmed) onSave(source, trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("sourceRename.title")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={inputId}>{t("sourceRename.label")}</Label>
            <Input
              id={inputId}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              className="min-h-11"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
              {t("sourceRename.cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={pending || trimmed === ""}>
              {t("sourceRename.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
