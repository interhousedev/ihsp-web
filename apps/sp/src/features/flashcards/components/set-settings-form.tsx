"use client"

import type { FlashcardSetDetail, FlashcardSetPatchBody } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { useUpdateFlashcardSet } from "../hooks/use-flashcards"

// The limits of the backend (plan B10).
const NEW_PER_DAY = { min: 1, max: 200 }
const REVIEWS_PER_DAY = { min: 1, max: 2000 }

function parseLimit(value: string, range: { min: number; max: number }): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return parsed >= range.min && parsed <= range.max ? parsed : null
}

/** Title, description and daily limits of a deck (WEB-23: 20 new cards and 200 reviews by default). */
export function SetSettingsForm({ set, onSaved }: { set: FlashcardSetDetail; onSaved?: () => void }) {
  const t = useT("flashcards.options")
  const errorMessage = useErrorMessage()
  const update = useUpdateFlashcardSet(set.id)
  const ids = { title: useId(), description: useId(), newPerDay: useId(), reviewsPerDay: useId() }
  const [title, setTitle] = useState(set.title)
  const [description, setDescription] = useState(set.description ?? "")
  const [newPerDay, setNewPerDay] = useState(String(set.new_per_day))
  const [reviewsPerDay, setReviewsPerDay] = useState(String(set.reviews_per_day))

  useEffect(() => {
    setTitle(set.title)
    setDescription(set.description ?? "")
    setNewPerDay(String(set.new_per_day))
    setReviewsPerDay(String(set.reviews_per_day))
  }, [set.title, set.description, set.new_per_day, set.reviews_per_day])

  const newLimit = parseLimit(newPerDay, NEW_PER_DAY)
  const reviewsLimit = parseLimit(reviewsPerDay, REVIEWS_PER_DAY)
  const valid = title.trim() !== "" && newLimit !== null && reviewsLimit !== null

  function submit() {
    if (!valid || newLimit === null || reviewsLimit === null) return
    const body: FlashcardSetPatchBody = {
      title: title.trim(),
      description: description.trim(),
      new_per_day: newLimit,
      reviews_per_day: reviewsLimit,
    }
    update.mutate(body, {
      onSuccess: () => {
        toast.success(t("saved"))
        onSaved?.()
      },
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={ids.title}>{t("titleLabel")}</Label>
        <Input
          id={ids.title}
          value={title}
          maxLength={200}
          className="min-h-11"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={ids.description}>{t("descriptionLabel")}</Label>
        <Textarea
          id={ids.description}
          value={description}
          maxLength={1000}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.newPerDay}>{t("newPerDay")}</Label>
          <Input
            id={ids.newPerDay}
            inputMode="numeric"
            value={newPerDay}
            aria-invalid={newLimit === null}
            className="min-h-11"
            onChange={(event) => setNewPerDay(event.target.value)}
          />
          {newLimit === null ? <p className="text-destructive text-xs">{t("limitInvalid", NEW_PER_DAY)}</p> : null}
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={ids.reviewsPerDay}>{t("reviewsPerDay")}</Label>
          <Input
            id={ids.reviewsPerDay}
            inputMode="numeric"
            value={reviewsPerDay}
            aria-invalid={reviewsLimit === null}
            className="min-h-11"
            onChange={(event) => setReviewsPerDay(event.target.value)}
          />
          {reviewsLimit === null ? (
            <p className="text-destructive text-xs">{t("limitInvalid", REVIEWS_PER_DAY)}</p>
          ) : null}
        </div>
      </div>
      {update.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(update.error)}
        </p>
      ) : null}
      <div>
        <Button type="submit" className="min-h-11" disabled={!valid || update.isPending}>
          {update.isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  )
}
