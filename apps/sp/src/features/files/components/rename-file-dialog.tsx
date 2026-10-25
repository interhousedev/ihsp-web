"use client"

import type { FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from "@ihsp/ui"
import { useId, useState } from "react"
import { useRenameFile } from "../hooks/use-my-files"

type RenameFileDialogProps = { file: FileItem | null; onClose: () => void }

function RenameFileForm({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const t = useT("files.rename")
  const errorMessage = useErrorMessage()
  const rename = useRenameFile()
  const inputId = useId()
  const [name, setName] = useState(file.name)
  const trimmed = name.trim()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed) rename.mutate({ id: file.id, name: trimmed }, { onSuccess: onClose })
      }}
    >
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId}>{t("label")}</Label>
        <Input
          id={inputId}
          value={name}
          maxLength={255}
          className="min-h-11"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      {rename.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(rename.error)}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button type="submit" className="min-h-11" disabled={rename.isPending || trimmed === ""}>
          {t("save")}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Rename dialog; the form is keyed by the file, so every file starts with its own name and a clean error state. */
export function RenameFileDialog({ file, onClose }: RenameFileDialogProps) {
  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>{file ? <RenameFileForm key={file.id} file={file} onClose={onClose} /> : null}</DialogContent>
    </Dialog>
  )
}
