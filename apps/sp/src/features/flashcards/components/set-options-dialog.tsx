"use client"

import type { FlashcardSetDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ihsp/ui"
import { SetSettingsForm } from "./set-settings-form"

export type SetOptionsDialogProps = {
  deck: FlashcardSetDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
}

/** Anki's deck "Options": title, description, the daily limits, and deleting the deck. */
export function SetOptionsDialog({ deck, open, onOpenChange, onDelete }: SetOptionsDialogProps) {
  const t = useT("flashcards.options")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { title: deck.title })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <SetSettingsForm set={deck} onSaved={() => onOpenChange(false)} />
        <div className="border-t pt-4">
          <Button type="button" variant="destructive" className="min-h-11" onClick={onDelete}>
            {t("delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
