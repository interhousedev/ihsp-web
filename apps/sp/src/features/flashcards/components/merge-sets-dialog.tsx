"use client"

import type { FlashcardSetItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Label, ResponsiveDialog } from "@ihsp/ui"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { toast } from "sonner"
import { useMergeFlashcardSets } from "../hooks/use-flashcards"
import { deckHref } from "../utils/hrefs"

const MAX_SETS = 20

export type MergeSetsDialogProps = {
  decks: readonly FlashcardSetItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Choose sets and a title: the new set gets copies of their cards with fresh progress; the sources stay. */
export function MergeSetsDialog({ decks, open, onOpenChange }: MergeSetsDialogProps) {
  const t = useT("flashcards.page")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const merge = useMergeFlashcardSets()
  const titleId = useId()
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const valid = selected.length >= 2 && selected.length <= MAX_SETS && title.trim() !== ""

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((value) => value !== id)))
  }

  function submit() {
    if (!valid) return
    merge.mutate(
      { set_ids: selected, title: title.trim() },
      {
        onSuccess: (result) => {
          toast.success(t("merged", { count: result.set.card_count, skipped: result.duplicates_skipped }))
          onOpenChange(false)
          router.push(deckHref(result.set.id))
        },
      },
    )
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("mergeTitle")}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      footer={
        <Button type="submit" className="min-h-11" disabled={!valid || merge.isPending}>
          {t("mergeSubmit")}
        </Button>
      }
    >
      <p className="text-muted-foreground text-sm">{t("mergeHint")}</p>
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">{t("mergeSets")}</legend>
        {decks.map((deck) => (
          <label key={deck.id} className="flex min-h-11 min-w-0 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5 shrink-0"
              checked={selected.includes(deck.id)}
              onChange={(event) => toggle(deck.id, event.target.checked)}
            />
            <span className="min-w-0 flex-1 truncate">{deck.title}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{deck.card_count}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1">
        <Label htmlFor={titleId}>{t("mergeName")}</Label>
        <Input
          id={titleId}
          value={title}
          maxLength={200}
          className="min-h-11"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      {merge.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(merge.error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  )
}
