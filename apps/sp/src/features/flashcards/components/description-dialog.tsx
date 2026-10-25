"use client"

import type { FlashcardSetDetail } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@ihsp/ui"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useUpdateFlashcardSet } from "../hooks/use-flashcards"

type DescriptionDialogProps = { deck: FlashcardSetDetail; open: boolean; onOpenChange: (open: boolean) => void }

/** Anki's "Description" button: the text under the deck title. */
export function DescriptionDialog({ deck, open, onOpenChange }: DescriptionDialogProps) {
  const t = useT("flashcards.descriptionDialog")
  const errorMessage = useErrorMessage()
  const update = useUpdateFlashcardSet(deck.id)
  const id = useId()
  const [text, setText] = useState(deck.description ?? "")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setText(deck.description ?? "")
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            update.mutate(
              { description: text.trim() },
              {
                onSuccess: () => {
                  toast.success(t("saved"))
                  onOpenChange(false)
                },
              },
            )
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={id}>{t("label")}</Label>
            <Textarea
              id={id}
              value={text}
              maxLength={1000}
              rows={5}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
          {update.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(update.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={update.isPending}>
              {update.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
