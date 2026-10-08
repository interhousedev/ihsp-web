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
  Textarea,
} from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { useCreateFlashcardSet } from "../hooks/use-flashcards"

type NewSetDialogProps = { open: boolean; onOpenChange: (open: boolean) => void }

/** Creates an empty set, then opens the card editor (UF-WEB-23). */
export function NewSetDialog({ open, onOpenChange }: NewSetDialogProps) {
  const t = useT("flashcards.new")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const create = useCreateFlashcardSet()
  const titleId = useId()
  const descriptionId = useId()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const trimmedTitle = title.trim()

  function submit() {
    if (!trimmedTitle) return
    const trimmedDescription = description.trim()
    create.mutate(
      { title: trimmedTitle, ...(trimmedDescription ? { description: trimmedDescription } : {}), cards: [] },
      {
        onSuccess: (set) => {
          onOpenChange(false)
          setTitle("")
          setDescription("")
          router.push(`/flashcards/edit/?id=${encodeURIComponent(set.id)}`)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={titleId}>{t("titleLabel")}</Label>
            <Input
              id={titleId}
              value={title}
              maxLength={120}
              className="min-h-11"
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={descriptionId}>{t("descriptionLabel")}</Label>
            <Textarea
              id={descriptionId}
              value={description}
              maxLength={500}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {create.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(create.error)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={create.isPending || !trimmedTitle}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
