"use client"

import type { PublicShare, ReviewRating } from "@ihsp/api"
import {
  StudyScreen,
  createLocalSession,
  localAnswer,
  localCounts,
  localNext,
  type LocalNext,
  type LocalSession,
} from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useState } from "react"

type Card = NonNullable<PublicShare["flashcards"]>["cards"][number]

/** The session and the card it offers; the card is chosen when a rating arrives, never while rendering. */
type Round = { session: LocalSession; next: LocalNext | null; run: number }

function startRound(cards: readonly Card[], run: number): Round {
  const session = createLocalSession(cards)
  return { session, next: localNext(session, Date.now()), run }
}

/**
 * Study a shared set in the browser with Anki's study screen. Nothing is saved on the server (a shared set has no
 * owner to keep progress for): the cards follow the same learning steps as the real thing, in memory only.
 */
export function StudyMode({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const t = useT("share.flashcards")
  const [round, setRound] = useState(() => startRound(cards, 0))
  const { session, next, run } = round

  function rate(rating: ReviewRating) {
    if (!next) return
    const now = Date.now()
    const answered = localAnswer(session, next.card.id, rating, now)
    setRound({ session: answered, next: localNext(answered, now), run })
  }

  return (
    <div className="flex flex-col gap-4">
      {next ? (
        <div>
          <Button variant="ghost" className="min-h-11" onClick={onExit}>
            {t("backToList")}
          </Button>
        </div>
      ) : null}
      <StudyScreen
        key={run}
        card={next ? { ...next.card, state: next.state } : null}
        intervals={next?.intervals}
        counts={localCounts(session)}
        reviewed={session.reviewed}
        onRate={rate}
      />
      {next ? null : (
        <div className="flex flex-wrap justify-center gap-2">
          <Button className="min-h-11" onClick={() => setRound(startRound(cards, run + 1))}>
            {t("studyAgain")}
          </Button>
          <Button variant="outline" className="min-h-11" onClick={onExit}>
            {t("backToList")}
          </Button>
        </div>
      )}
    </div>
  )
}
