import type { ReviewRating } from "@ihsp/api"
import { NEW_SRS, answerCard, previewIntervals, type LocalIntervals, type LocalSrs } from "./local-srs"

export type SessionCard = { id: string; front: string; back: string }

export type LocalSession = {
  cards: SessionCard[]
  /** Scheduling state of the cards that are still in the session; graduated cards leave it. */
  states: Record<string, LocalSrs>
  reviewed: number
}

export type LocalNext = {
  card: SessionCard
  state: LocalSrs["state"]
  intervals: LocalIntervals
}

export type LocalCounts = { new: number; learning: number; review: number }

/** A study session over cards that are not saved anywhere: the browser is the only place its progress lives. */
export function createLocalSession(cards: readonly SessionCard[]): LocalSession {
  return { cards: [...cards], states: Object.fromEntries(cards.map((card) => [card.id, NEW_SRS])), reviewed: 0 }
}

function inSession(session: LocalSession): { card: SessionCard; srs: LocalSrs }[] {
  return session.cards.flatMap((card) => {
    const srs = session.states[card.id]
    return srs ? [{ card, srs }] : []
  })
}

export function localCounts(session: LocalSession): LocalCounts {
  const rows = inSession(session)
  return {
    new: rows.filter((row) => row.srs.state === "new").length,
    learning: rows.filter((row) => row.srs.state === "learning" || row.srs.state === "relearning").length,
    review: 0,
  }
}

/**
 * The next card, in Anki's order: learning cards that are due, then new cards, then (learn ahead) the learning card
 * that is due first. `null` when every card has graduated.
 */
export function localNext(session: LocalSession, now: number): LocalNext | null {
  const rows = inSession(session)
  const learning = rows
    .filter((row) => row.srs.state === "learning" || row.srs.state === "relearning")
    .toSorted((a, b) => (a.srs.dueAt ?? 0) - (b.srs.dueAt ?? 0))
  const due = learning.find((row) => (row.srs.dueAt ?? 0) <= now)
  const fresh = rows.find((row) => row.srs.state === "new")
  const picked = due ?? fresh ?? learning[0]
  if (!picked) return null
  return { card: picked.card, state: picked.srs.state, intervals: previewIntervals(picked.srs, now) }
}

/** Applies a rating; a card that becomes a review card (due in a day or more) is done for this session. */
export function localAnswer(session: LocalSession, cardId: string, rating: ReviewRating, now: number): LocalSession {
  const current = session.states[cardId]
  if (!current) return session
  const next = answerCard(current, rating, now)
  const states = { ...session.states }
  if (next.state === "review") delete states[cardId]
  else states[cardId] = next
  return { ...session, states, reviewed: session.reviewed + 1 }
}
