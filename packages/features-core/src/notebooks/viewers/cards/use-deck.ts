"use client"

import type { FlashcardsContent } from "@ihsp/api"
import { useCallback, useMemo, useRef, useState } from "react"
import { useDebouncedProgress } from "../use-debounced-progress"
import {
  deleteCard,
  mark,
  move,
  parseDeck,
  restart,
  shuffleDeck,
  type DeckState,
  type RestartMode,
  type Verdict,
} from "./deck-state"

export type DeckActions = {
  mark: (id: string, verdict: Verdict) => void
  move: (delta: number) => void
  shuffle: () => void
  remove: (id: string) => void
  restart: (mode: RestartMode) => void
}

/**
 * The state of a flash card deck: restored from `artifact.progress_state`, changed through `actions`, and saved
 * (debounced) on every change.
 */
export function useDeck(
  notebookId: string,
  artifactId: string,
  cards: FlashcardsContent["cards"],
  progressState: unknown,
): { deck: DeckState; cardIds: string[]; actions: DeckActions } {
  const save = useDebouncedProgress(notebookId, artifactId)
  const cardIds = useMemo(() => cards.map((card) => card.id), [cards])
  const [deck, setDeck] = useState(() => parseDeck(progressState, cardIds))
  const latest = useRef(deck)

  const apply = useCallback(
    (change: (current: DeckState) => DeckState) => {
      const next = change(latest.current)
      if (next === latest.current) return
      latest.current = next
      setDeck(next)
      save(next)
    },
    [save],
  )

  const actions = useMemo<DeckActions>(
    () => ({
      mark: (id, verdict) => apply((current) => mark(current, id, verdict)),
      move: (delta) => apply((current) => move(current, delta)),
      shuffle: () => apply((current) => shuffleDeck(current)),
      remove: (id) => apply((current) => deleteCard(current, id)),
      restart: (mode) => apply((current) => restart(current, mode, cardIds)),
    }),
    [apply, cardIds],
  )

  return { deck, cardIds, actions }
}
