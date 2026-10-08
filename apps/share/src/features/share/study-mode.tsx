"use client"

import type { PublicShare, ReviewRating } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Markdown, Progress } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { RATINGS, afterRating, isTypingTarget, ratingForKey } from "./study-keys"

type Card = NonNullable<PublicShare["flashcards"]>["cards"][number]

/**
 * Study a shared set in the browser: front, **Show answer** (Space), four rating buttons (keys 1 to 4). Nothing is
 * saved; "Again" puts the card back at the end of the round.
 */
export function StudyMode({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const t = useT("share.flashcards")
  const [queue, setQueue] = useState<string[]>(() => cards.map((card) => card.id))
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const current = cards.find((card) => card.id === queue[0])

  function rate(rating: ReviewRating) {
    if (!revealed) return
    setQueue((previous) => afterRating(previous, rating))
    setReviewed((count) => count + 1)
    setRevealed(false)
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === " " && !revealed && current) {
        event.preventDefault()
        setRevealed(true)
        return
      }
      const rating = ratingForKey(event.key)
      if (rating && revealed) {
        event.preventDefault()
        rate(rating)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const done = cards.length - queue.length

  if (!current) {
    return (
      <section aria-labelledby="share-study-done" className="flex flex-col items-center gap-4 py-8 text-center">
        <h2 id="share-study-done" className="text-xl font-semibold">
          {t("finished")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("reviewed", { count: reviewed })}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            className="min-h-11"
            onClick={() => {
              setQueue(cards.map((card) => card.id))
              setReviewed(0)
              setRevealed(false)
            }}
          >
            {t("studyAgain")}
          </Button>
          <Button variant="outline" className="min-h-11" onClick={onExit}>
            {t("backToList")}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section aria-label={t("study")} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="min-h-11" onClick={onExit}>
          {t("backToList")}
        </Button>
        <span className="text-muted-foreground text-sm">{t("progress", { done, total: cards.length })}</span>
      </div>
      <Progress value={(done / Math.max(cards.length, 1)) * 100} aria-label={t("progressLabel")} />
      <div className="bg-card flex min-h-48 flex-col gap-4 rounded-xl border p-5">
        <div>
          <p className="text-muted-foreground text-xs font-medium">{t("front")}</p>
          <Markdown>{current.front}</Markdown>
        </div>
        {revealed ? (
          <div className="border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium">{t("back")}</p>
            <Markdown>{current.back}</Markdown>
          </div>
        ) : null}
      </div>
      {revealed ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((rating, index) => (
            <Button
              key={rating}
              variant={rating === "again" ? "destructive" : "outline"}
              className="min-h-12"
              onClick={() => rate(rating)}
            >
              {t(`rating.${rating}`)}
              <span className="text-muted-foreground ms-1 text-xs">{index + 1}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button className="min-h-12" onClick={() => setRevealed(true)}>
          {t("showAnswer")}
        </Button>
      )}
    </section>
  )
}
