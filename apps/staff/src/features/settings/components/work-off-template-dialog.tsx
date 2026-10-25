"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@ihsp/ui"
import { useId, useState } from "react"

/** A work-off template: its text (1 to 1000 characters). The caller shows the error of a failed save. */
export function WorkOffTemplateDialog({
  title,
  initialText,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  title: string
  initialText: string
  pending: boolean
  error: string | null
  onSubmit: (text: string) => void
  onClose: () => void
}) {
  const t = useT("settings.workOffs")
  const tc = useT("common")
  const id = useId()
  const [text, setText] = useState(initialText)
  const trimmed = text.trim()

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{t("text")}</Label>
          <Textarea
            id={id}
            value={text}
            rows={4}
            maxLength={1000}
            placeholder={t("placeholder")}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            className="min-h-11 md:min-h-8"
            disabled={pending || trimmed === ""}
            onClick={() => onSubmit(trimmed)}
          >
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
