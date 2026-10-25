// Progress of a flash card deck:
// `{known, missed, deleted, order, position}`, saved with `PUT .../progress`. All functions are pure.

export type DeckState = {
  /** Cards marked "Got it" in the current round. */
  known: string[]
  /** Cards marked "Missed it" in the current round. */
  missed: string[]
  /** Cards the student removed from the deck. */
  deleted: string[]
  /** The cards of the current round in study order (a round may hold only some of the cards). */
  order: string[]
  /** Index in the queue (the order without deleted cards). */
  position: number
}

export type Verdict = "known" | "missed"
export type RestartMode = "same" | "all" | "missed"

export function freshDeck(cardIds: readonly string[]): DeckState {
  return { known: [], missed: [], deleted: [], order: [...cardIds], position: 0 }
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

function unique(ids: readonly string[], valid: ReadonlySet<string>): string[] {
  return [...new Set(ids)].filter((id) => valid.has(id))
}

/** The queue: the cards of the round that were not deleted, in study order. */
export function queueOf(deck: DeckState): string[] {
  const deleted = new Set(deck.deleted)
  return deck.order.filter((id) => !deleted.has(id))
}

function clampPosition(deck: DeckState): DeckState {
  const last = Math.max(0, queueOf(deck).length - 1)
  const position = Math.min(Math.max(0, deck.position), last)
  return position === deck.position ? deck : { ...deck, position }
}

/**
 * Reads the saved progress. Anything that does not have the expected shape gives a fresh deck; ids of cards that no
 * longer exist are dropped.
 */
export function parseDeck(raw: unknown, cardIds: readonly string[]): DeckState {
  if (typeof raw !== "object" || raw === null) return freshDeck(cardIds)
  const value = raw as Record<string, unknown>
  const { known, missed, deleted, order, position } = value
  if (
    !isStringArray(known) ||
    !isStringArray(missed) ||
    !isStringArray(deleted) ||
    !isStringArray(order) ||
    typeof position !== "number" ||
    !Number.isFinite(position)
  ) {
    return freshDeck(cardIds)
  }
  const valid = new Set(cardIds)
  const knownIds = unique(known, valid)
  const parsed: DeckState = {
    known: knownIds,
    missed: unique(missed, valid).filter((id) => !knownIds.includes(id)),
    deleted: unique(deleted, valid),
    order: unique(order, valid),
    position: Math.trunc(position),
  }
  if (queueOf(parsed).length === 0) {
    // A round with nothing left is only valid when every card was deleted; otherwise start over.
    const everythingDeleted = cardIds.every((id) => parsed.deleted.includes(id))
    if (!everythingDeleted)
      return {
        ...freshDeck(cardIds),
        deleted: parsed.deleted,
        order: cardIds.filter((id) => !parsed.deleted.includes(id)),
      }
  }
  return clampPosition(parsed)
}

export function verdictOf(deck: DeckState, id: string): Verdict | null {
  if (deck.known.includes(id)) return "known"
  if (deck.missed.includes(id)) return "missed"
  return null
}

export function counts(deck: DeckState): { known: number; missed: number; total: number } {
  const queue = queueOf(deck)
  return {
    known: queue.filter((id) => deck.known.includes(id)).length,
    missed: queue.filter((id) => deck.missed.includes(id)).length,
    total: queue.length,
  }
}

/** True when the round has cards and every one of them is marked. */
export function isFinished(deck: DeckState): boolean {
  const { known, missed, total } = counts(deck)
  return total > 0 && known + missed === total
}

/** Marks the card and moves on to the next card that has no mark yet (wrapping around); stays when none is left. */
export function mark(deck: DeckState, id: string, verdict: Verdict): DeckState {
  const withMark: DeckState = {
    ...deck,
    known:
      verdict === "known"
        ? [...deck.known.filter((item) => item !== id), id]
        : deck.known.filter((item) => item !== id),
    missed:
      verdict === "missed"
        ? [...deck.missed.filter((item) => item !== id), id]
        : deck.missed.filter((item) => item !== id),
  }
  const queue = queueOf(withMark)
  const unmarked = (index: number) => verdictOf(withMark, queue[index] ?? "") === null
  for (let step = 1; step < queue.length; step += 1) {
    const index = (withMark.position + step) % queue.length
    if (unmarked(index)) return { ...withMark, position: index }
  }
  return withMark
}

/** Previous (-1) and next (+1) without marking; stops at the ends. */
export function move(deck: DeckState, delta: number): DeckState {
  const next = clampPosition({ ...deck, position: deck.position + delta })
  return next.position === deck.position ? deck : next
}

/** Fisher-Yates over the whole round (marks stay); starts again from the first card. */
export function shuffleDeck(deck: DeckState, random: () => number = Math.random): DeckState {
  const order = [...deck.order]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    const current = order[index]
    const swap = order[other]
    if (current === undefined || swap === undefined) continue
    order[index] = swap
    order[other] = current
  }
  return { ...deck, order, position: 0 }
}

/** Removes the card from the deck for good; the next card takes its place. */
export function deleteCard(deck: DeckState, id: string): DeckState {
  if (deck.deleted.includes(id)) return deck
  return clampPosition({
    ...deck,
    deleted: [...deck.deleted, id],
    known: deck.known.filter((item) => item !== id),
    missed: deck.missed.filter((item) => item !== id),
  })
}

/**
 * A new round without marks, from the first card: `same` keeps the cards of this round, `all` takes every card that
 * was not deleted (in the original order), `missed` only the cards marked "Missed it".
 */
export function restart(deck: DeckState, mode: RestartMode, cardIds: readonly string[]): DeckState {
  const deleted = new Set(deck.deleted)
  const order =
    mode === "all"
      ? cardIds.filter((id) => !deleted.has(id))
      : mode === "missed"
        ? queueOf(deck).filter((id) => deck.missed.includes(id))
        : deck.order
  return { ...deck, known: [], missed: [], order: [...order], position: 0 }
}
