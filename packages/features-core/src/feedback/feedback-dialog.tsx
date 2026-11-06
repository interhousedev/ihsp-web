"use client"

import type { FeedbackArea } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { FeedbackForm } from "./feedback-form"

export type FeedbackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The section the user is in (the app passes its own), preselected in the area selector. */
  defaultArea: FeedbackArea
}

/** "Suggest an idea / report a problem" in a dialog; a full-height sheet on phones. */
export function FeedbackDialog({ open, onOpenChange, defaultArea }: FeedbackDialogProps) {
  const t = useT("feedback")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("dialog.title")} size="sm">
      <FeedbackForm defaultArea={defaultArea} onClose={() => onOpenChange(false)} />
    </ResponsiveDialog>
  )
}
