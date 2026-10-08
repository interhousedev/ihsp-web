"use client"

import type { ReviewRating } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Markdown, PageContainer, Progress, StateView } from "@ihsp/ui"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useFlashcardSet, useReviewFlashcard, useStudyNext } from "../hooks/use-flashcards"
import { RATINGS, isTypingTarget, ratingForKey } from "../utils/study-keys"
import { StudySummary } from "./study-summary"

/** `/flashcards/study/?id=`: front, **Show answer** (Space), four rating buttons with intervals (keys 1 to 4). */
export function StudySession() {
  const t = useT("flashcards.study")
  const errorMessage = useErrorMessage()
  const id = useSearchParams().get("id")
  const set = useFlashcardSet(id)
  const study = useStudyNext(id)
  const review = useReviewFlashcard(id ?? "")
  // The card whose answer is shown; a new card, or the same card after a review, starts hidden.
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null)
  const [reviewed, setReviewed] = useState(0)

  const next = study.data
  const card = next?.card ?? null

  const revealed = card !== null && revealedCardId === card.id

  function rate(rating: ReviewRating) {
    if (!revealed || card === null || review.isPending) return
    review.mutate(
      { cardId: card.id, rating },
      {
        onSuccess: () => {
          setReviewed((count) => count + 1)
          setRevealedCardId(null)
        },
      },
    )
  }

  function handleKey(event: KeyboardEvent) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return
    if (card === null) return
    if (event.key === " " || event.code === "Space") {
      if (!revealed) {
        event.preventDefault()
        setRevealedCardId(card.id)
      }
      return
    }
    const rating = ratingForKey(event.key)
    if (rating && revealed) {
      event.preventDefault()
      rate(rating)
    }
  }
  // The window listener always calls the latest handler, which sees the current card and `revealed`.
  const handlerRef = useRef<(event: KeyboardEvent) => void>(() => undefined)
  useEffect(() => {
    handlerRef.current = handleKey
  })
  useEffect(() => {
    const listener = (event: KeyboardEvent) => handlerRef.current(event)
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [])

  const title = set.data?.title ?? t("title")
  const back = (
    <Link
      href={id ? `/flashcards/set/?id=${encodeURIComponent(id)}` : "/flashcards/"}
      className="hover:bg-muted inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium"
    >
      <IconArrowLeft className="size-4" aria-hidden />
      {t("backToSet")}
    </Link>
  )

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }
  if (study.isPending) {
    return (
      <PageContainer title={title} actions={back}>
        <StateView state="loading" rows={3} />
      </PageContainer>
    )
  }
  if (study.isError || next === undefined) {
    return (
      <PageContainer title={title} actions={back}>
        <StateView state="error" error={study.error} onRetry={() => void study.refetch()} />
      </PageContainer>
    )
  }

  const remaining = next.counts.learning + next.counts.review + next.counts.new
  const total = reviewed + remaining
  const percent = total === 0 ? 100 : Math.round((reviewed / total) * 100)

  return (
    <PageContainer title={title} actions={back}>
      {card === null || next.done_for_today ? (
        <StudySummary setId={id} reviewed={reviewed} />
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Progress value={percent} aria-label={t("progress")} />
            <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
              <span>{t("remaining", { count: remaining })}</span>
              <span>
                {t("counts", { learning: next.counts.learning, review: next.counts.review, new: next.counts.new })}
              </span>
            </p>
          </div>

          <section aria-label={t("card")} className="bg-card flex min-h-56 flex-col gap-4 rounded-xl border p-4 md:p-6">
            <div data-testid="card-front">
              <p className="text-muted-foreground mb-1 text-xs uppercase">{t("front")}</p>
              <Markdown className="text-base">{card.front}</Markdown>
            </div>
            {revealed ? (
              <div className="border-t pt-4" data-testid="card-back">
                <p className="text-muted-foreground mb-1 text-xs uppercase">{t("back")}</p>
                <Markdown className="text-base">{card.back}</Markdown>
              </div>
            ) : null}
          </section>

          {revealed ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label={t("rate")}>
              {RATINGS.map((rating, index) => (
                <Button
                  key={rating}
                  type="button"
                  variant={rating === "again" ? "destructive" : "outline"}
                  className="h-auto min-h-14 flex-col gap-0.5 py-2"
                  disabled={review.isPending}
                  aria-keyshortcuts={String(index + 1)}
                  onClick={() => rate(rating)}
                >
                  <span className="text-sm font-medium">{t(`rating.${rating}`)}</span>
                  <span className="text-muted-foreground text-xs">{next.intervals?.[rating] ?? ""}</span>
                  <kbd className="text-muted-foreground hidden text-[10px] sm:inline">{index + 1}</kbd>
                </Button>
              ))}
            </div>
          ) : (
            <Button
              type="button"
              className="min-h-14 text-base"
              aria-keyshortcuts="Space"
              onClick={() => setRevealedCardId(card.id)}
            >
              {t("showAnswer")}
            </Button>
          )}
          {review.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(review.error)}
            </p>
          ) : null}
        </div>
      )}
    </PageContainer>
  )
}
