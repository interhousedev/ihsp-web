"use client"

import type { ReviewRating } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { CountQueue } from "../utils/count-colors"
import { RatingButtons } from "./rating-buttons"
import { StudyCounts } from "./study-counts"
import { useStudyShortcuts } from "./use-study-shortcuts"
import { StudioMarkdown } from "../../openui/studio-markdown"

export type StudyCard = {
  id: string
  front: string
  back: string
  /** `new`, `learning`, `review` or `relearning`; tells which count to underline when `queue` is not given. */
  state?: string | undefined
}

export type StudyScreenProps = {
  /** The card to show; `null` when nothing is left (the "finished" message shows). */
  card: StudyCard | null
  /** The label of each button, e.g. "10m"; `null` or missing hides them. */
  intervals?: Record<ReviewRating, string> | null | undefined
  counts: { new: number; learning: number; review: number }
  /** Called with the rating and how long the card was on screen, in milliseconds. */
  onRate: (rating: ReviewRating, durationMs: number) => void
  /** A rating is on its way: the buttons wait. */
  isRating?: boolean
  /** Cards answered so far; also tells the screen that the same card came back and must start hidden again. */
  reviewed?: number
  /** A message under the card, e.g. the error of the last rating. */
  error?: string | undefined
  queue?: CountQueue | undefined
  /** The Edit and Limits buttons at the top left; a button shows when its callback is given. */
  onEdit?: (() => void) | undefined
  onLimits?: (() => void) | undefined
  /** Where "Back to the deck" leads on the finished screen. */
  exitHref?: string | undefined
  /** `embedded` is the compact form inside a lesson step: no top buttons, no minimum height. */
  variant?: "page" | "embedded"
  className?: string
}

function queueOf(card: StudyCard | null): CountQueue | undefined {
  if (!card?.state) return undefined
  if (card.state === "new") return "new"
  if (card.state === "review") return "review"
  return "learning"
}

/**
 * Anki's study screen: Edit and Limits at the top left, the colored counts at the top right with the current queue
 * underlined, the question centered, a separator and the answer after "Show answer", and Again, Hard, Good and Easy
 * at the bottom with the next interval above each. Space or Enter shows the answer, 1 to 4 answer the card.
 */
export function StudyScreen({
  card,
  intervals,
  counts,
  onRate,
  isRating = false,
  reviewed = 0,
  error,
  queue,
  onEdit,
  onLimits,
  exitHref,
  variant = "page",
  className,
}: StudyScreenProps) {
  const t = useT("flashcards.study")
  const showKey = card ? `${card.id}:${reviewed}` : null
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const shownAt = useRef<number | null>(null)
  const revealed = showKey !== null && revealedKey === showKey

  // The clock starts when a card appears; it is read in effects and handlers only, never during render.
  useEffect(() => {
    shownAt.current = showKey === null ? null : Date.now()
  }, [showKey])

  function reveal() {
    if (showKey !== null) setRevealedKey(showKey)
  }

  function rate(rating: ReviewRating) {
    if (!revealed || isRating) return
    onRate(rating, shownAt.current === null ? 0 : Math.max(0, Date.now() - shownAt.current))
  }

  useStudyShortcuts({ active: card !== null && !isRating, revealed, onReveal: reveal, onRate: rate })

  const embedded = variant === "embedded"
  const topButton = "min-h-11 px-4 md:min-h-8"

  if (card === null) {
    return (
      <section
        aria-label={t("title")}
        className={cn("flex flex-col items-center gap-4 py-10 text-center", className)}
        data-testid="study-done"
      >
        <StudyCounts counts={counts} className="self-end" />
        <h2 className="text-xl font-semibold">{t("done.title")}</h2>
        {reviewed > 0 ? (
          <p className="text-muted-foreground text-sm">{t("done.reviewed", { count: reviewed })}</p>
        ) : null}
        {exitHref ? (
          <Link href={exitHref} className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-5")}>
            {t("done.back")}
          </Link>
        ) : null}
      </section>
    )
  }

  return (
    <section aria-label={t("title")} className={cn("flex flex-col gap-4", !embedded && "min-h-[70vh]", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!embedded && onEdit ? (
            <Button type="button" variant="outline" className={topButton} onClick={onEdit}>
              {t("edit")}
            </Button>
          ) : null}
          {!embedded && onLimits ? (
            <Button type="button" variant="outline" className={topButton} onClick={onLimits}>
              {t("limits")}
            </Button>
          ) : null}
        </div>
        <StudyCounts counts={counts} queue={queue ?? queueOf(card)} />
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col items-center gap-5 px-1 text-center",
          embedded ? "justify-center py-4" : "py-6 md:py-10",
        )}
      >
        <div data-testid="card-front" className="w-full text-xl md:text-2xl">
          <StudioMarkdown>{card.front}</StudioMarkdown>
        </div>
        {revealed ? (
          <>
            <hr className="border-border w-full" />
            <div data-testid="card-back" className="w-full text-xl md:text-2xl">
              <StudioMarkdown>{card.back}</StudioMarkdown>
            </div>
          </>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-[4.75rem] flex-col items-center justify-end pb-[var(--safe-bottom,0px)]">
        {revealed ? (
          <RatingButtons intervals={intervals} disabled={isRating} onRate={rate} />
        ) : (
          <Button
            type="button"
            className="h-12 w-full max-w-xs rounded-lg text-base font-semibold"
            aria-keyshortcuts="Space Enter"
            onClick={reveal}
          >
            {t("showAnswer")}
          </Button>
        )}
      </div>
    </section>
  )
}
