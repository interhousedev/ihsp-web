"use client"

import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("description")}
      size="sm"
    >
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
    </ResponsiveDialog>
  )
}
