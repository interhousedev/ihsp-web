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
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
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
  /**
   * Reason codes the action may carry (`StatusReasonCode`s such as `unpublished`). When this is given (even empty) the
   * dialog has two fields, as the API does: a short **reason** (a code picked from the list, or own words of at most
   * 40 characters) and an optional free **message** to the owner (`note`). Without it the dialog is one text field.
   */
  codes?: readonly string[]
  /** With `codes`: the message to the owner must be written too (default: optional). */
  noteRequired?: boolean
  /** Called with the trimmed reason and, in coded mode, the trimmed message. Not called when a required field is empty. */
  onSubmit: (reason: string, note?: string) => void
}

/** The select value that means "write my own words". */
const OTHER = "__other__"
/** `ModerationBody.reason` holds at most this many characters. */
export const MAX_REASON = 40
const MAX_NOTE = 2000

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
  codes,
  noteRequired = false,
  onSubmit,
}: ReasonDialogProps) {
  const t = useT("library.manage")
  const common = useT("common")
  const errorMessage = useErrorMessage()
  const fieldId = useId()
  const [reason, setReason] = useState("")
  // `null`: the user has not chosen, so the first code of the action (it can change while the dialog is closed) applies.
  const [picked, setPicked] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [attempted, setAttempted] = useState(false)
  const coded = codes !== undefined

  // A reopened dialog starts empty.
  useEffect(() => {
    if (open) return
    setReason("")
    setNote("")
    setPicked(null)
    setAttempted(false)
  }, [open])

  const code = picked ?? codes?.[0] ?? OTHER
  const ownWords = !coded || code === OTHER
  const chosen = ownWords ? reason.trim() : code
  const missing = required && chosen === ""
  const noteMissing = coded && noteRequired && note.trim() === ""
  const showMissing = attempted && missing
  const showNoteMissing = attempted && noteMissing

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
            if (missing || noteMissing) return
            if (coded) onSubmit(chosen, note.trim() || undefined)
            else onSubmit(reason.trim())
          }}
        >
          {coded && codes.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-code`}>{t("reasonLabel")}</Label>
              <NativeSelect
                id={`${fieldId}-code`}
                className="w-full"
                value={code}
                onChange={(event) => setPicked(event.target.value)}
              >
                {codes.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {t(`reasonCodes.${value}`)}
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value={OTHER}>{t("reasonCodes.other")}</NativeSelectOption>
              </NativeSelect>
            </div>
          ) : null}
          {ownWords ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId}>{coded && codes.length > 0 ? t("reasonOwn") : t("reasonLabel")}</Label>
              {coded ? (
                <Input
                  id={fieldId}
                  value={reason}
                  maxLength={MAX_REASON}
                  required={required}
                  aria-invalid={showMissing}
                  aria-describedby={showMissing ? `${fieldId}-hint` : undefined}
                  className="min-h-11 md:min-h-8"
                  onChange={(event) => setReason(event.target.value)}
                />
              ) : (
                <Textarea
                  id={fieldId}
                  value={reason}
                  rows={4}
                  required={required}
                  aria-invalid={showMissing}
                  aria-describedby={showMissing ? `${fieldId}-hint` : undefined}
                  onChange={(event) => setReason(event.target.value)}
                />
              )}
              {showMissing ? (
                <p id={`${fieldId}-hint`} role="alert" className="text-destructive text-sm">
                  {t("reasonRequired")}
                </p>
              ) : null}
            </div>
          ) : null}
          {coded ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${fieldId}-note`}>{noteRequired ? t("noteLabel") : t("noteLabelOptional")}</Label>
              <Textarea
                id={`${fieldId}-note`}
                value={note}
                rows={4}
                maxLength={MAX_NOTE}
                aria-invalid={showNoteMissing}
                aria-describedby={showNoteMissing ? `${fieldId}-note-hint` : undefined}
                onChange={(event) => setNote(event.target.value)}
              />
              {showNoteMissing ? (
                <p id={`${fieldId}-note-hint`} role="alert" className="text-destructive text-sm">
                  {t("noteRequired")}
                </p>
              ) : null}
            </div>
          ) : null}
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
