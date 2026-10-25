"use client"

import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ihsp/ui"
import { ComposeMailForm } from "./compose-mail-form"

export { parseRecipients } from "./compose-mail-form"

export type ComposeMailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recipients to start with, for example the address of the profile the dialog was opened from. */
  initialTo?: readonly string[]
  initialSubject?: string
}

/** Write an email in a dialog (the compose shortcut); the form is shared with the Email page. */
export function ComposeMailDialog({ open, onOpenChange, initialTo = [], initialSubject = "" }: ComposeMailDialogProps) {
  const t = useT("composeMail")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ComposeMailForm
          initialTo={initialTo}
          initialSubject={initialSubject}
          onSent={() => onOpenChange(false)}
          actions={
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
