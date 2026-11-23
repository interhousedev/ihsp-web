import type { RecapCard, VideoCheck } from "@ihsp/api"
import { type FlashcardsBlock, type Interaction, newTempId } from "./content-ops"

/** A suggested pause the author edits in the preview before accepting it. */
export type CheckDraft = VideoCheck & { key: string }

/** A suggested recap card with the author's choice to keep it. */
export type CardDraft = RecapCard & { key: string; keep: boolean }

export function checkDrafts(checks: readonly VideoCheck[]): CheckDraft[] {
  return checks.toSorted((a, b) => a.at_seconds - b.at_seconds).map((check) => ({ ...check, key: newTempId() }))
}

export function cardDrafts(cards: readonly RecapCard[]): CardDraft[] {
  return cards.map((card) => ({ ...card, key: newTempId(), keep: true }))
}

/** A check is ready when it has a question, at least two filled options and the correct one among them. */
export function checkReady(check: VideoCheck): boolean {
  const filled = check.options.filter((option) => option.trim() !== "")
  return check.question.trim() !== "" && filled.length >= 2 && (check.options[check.correct_index] ?? "").trim() !== ""
}

/** The pause of the interactive video for an accepted check: a single-choice question, empty options dropped. */
export function checkToInteraction(check: VideoCheck): Interaction {
  const options = check.options
    .map((text, index) => ({
      id: newTempId(),
      text: text.trim(),
      correct: index === check.correct_index,
      pinned: false,
    }))
    .filter((option) => option.text !== "")
  return {
    id: newTempId(),
    at_sec: Math.max(0, Math.round(check.at_seconds * 10) / 10),
    kind: "question",
    text: check.question.trim(),
    options,
    multiple: false,
    url: "",
    points: 1,
  }
}

/** A flash cards block of the kept, filled recap cards; null when none is left. */
export function cardsToBlock(cards: readonly CardDraft[]): FlashcardsBlock | null {
  const kept = cards.filter((card) => card.keep && card.front.trim() !== "" && card.back.trim() !== "")
  if (kept.length === 0) return null
  return {
    id: newTempId(),
    type: "flashcards",
    cards: kept.map((card) => ({ id: newTempId(), front: card.front.trim(), back: card.back.trim() })),
  }
}
