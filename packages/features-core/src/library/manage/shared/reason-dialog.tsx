"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useEffect, useId, useState } from "react"

export type ReasonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  /** A reason must be written before the action runs (default true). */
  required?: boolean
  destructive?: boolean
  /** The action is running: the buttons stay disabled. */
  pending?: boolean
  /** The failed request, shown inside the dialog (the dialog stays open so the text is not lost). */
  error?: unknown
  /** Called with the trimmed reason. Not called when a required reason is empty. */
  onSubmit: (reason: string) => void
}

/**
 * The reason dialog of every librarian action that tells the owner why (request changes, reject, hold, unpublish,
 * take down). The reason is shown to the owner, so an empty one is refused here with "Write a reason. The owner will
 * see it." before any request is sent; the server also answers `422 common/request-validation` for it.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  required = true,
  destructive = false,
  pending = false,
  error,
  onSubmit,
}: ReasonDialogProps) {
  const t = useT("library.manage")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const fieldId = useId()
  const [reason, setReason] = useState("")
  const [attempted, setAttempted] = useState(false)

  // A reopened dialog starts empty.
  useEffect(() => {
    if (open) return
    setReason("")
    setAttempted(false)
  }, [open])

  const missing = required && reason.trim() === ""
  const showMissing = attempted && missing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            setAttempted(true)
            if (missing) return
            onSubmit(reason.trim())
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId}>{t("reasonLabel")}</Label>
            <Textarea
              id={fieldId}
              value={reason}
              rows={4}
              required={required}
              aria-invalid={showMissing}
              aria-describedby={showMissing ? `${fieldId}-hint` : undefined}
              onChange={(event) => setReason(event.target.value)}
            />
            {showMissing ? (
              <p id={`${fieldId}-hint`} role="alert" className="text-destructive text-sm">
                {t("reasonRequired")}
              </p>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-8"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {common("cancel")}
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              className="min-h-11 md:min-h-8"
              disabled={pending}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
