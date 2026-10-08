"use client"

import type { ReviewRating } from "@ihsp/api"
import { StudyScreen } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useFlashcardSet, useReviewFlashcard, useStudyNext } from "../hooks/use-flashcards"
import { deckHref, editHref, optionsHref } from "../utils/hrefs"

/**
 * `/flashcards/study/?id=`: Anki's study screen over the deck's queue. The answer is the next card; the time the card
 * was on screen goes with the rating into the review log.
 */
export function StudySession() {
  const t = useT("flashcards.page")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const id = useSearchParams().get("id")
  const deck = useFlashcardSet(id)
  const study = useStudyNext(id)
  const review = useReviewFlashcard(id ?? "")
  const [reviewed, setReviewed] = useState(0)

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }
  const title = deck.data?.title ?? t("title")
  if (study.isPending) {
    return (
      <PageContainer title={title}>
        <StateView state="loading" rows={3} />
      </PageContainer>
    )
  }
  if (study.isError || study.data === undefined) {
    return (
      <PageContainer title={title}>
        <StateView state="error" error={study.error} onRetry={() => void study.refetch()} />
      </PageContainer>
    )
  }

  const next = study.data

  function rate(rating: ReviewRating, durationMs: number) {
    if (!next.card) return
    review.mutate({ cardId: next.card.id, rating, durationMs }, { onSuccess: () => setReviewed((count) => count + 1) })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col px-4 pt-2 pb-6 md:px-6 md:pt-4">
      <h1 className="sr-only">{title}</h1>
      <StudyScreen
        card={next.card}
        intervals={next.intervals}
        counts={next.counts}
        reviewed={reviewed}
        isRating={review.isPending}
        error={review.isError ? errorMessage(review.error) : undefined}
        onRate={rate}
        onEdit={() => router.push(editHref(id))}
        onLimits={() => router.push(optionsHref(id))}
        exitHref={deckHref(id)}
      />
    </div>
  )
}
