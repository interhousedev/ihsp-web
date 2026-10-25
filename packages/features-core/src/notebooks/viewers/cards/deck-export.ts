import type { FlashcardsContent } from "@ihsp/api"
import { toCsv, toTsv } from "../../lib/csv"

type Card = FlashcardsContent["cards"][number]

/** CSV for Excel and Anki: front, back, topic (UTF-8 with BOM, no header row). */
export function cardsToCsv(cards: readonly Card[]): string {
  return toCsv(cards.map((card) => [card.front, card.back, card.topic ?? ""]))
}

/** Tab-separated front and back, one card per line: what Quizlet and spreadsheets paste. */
export function cardsToTsv(cards: readonly Card[]): string {
  return toTsv(cards.map((card) => [card.front, card.back]))
}
