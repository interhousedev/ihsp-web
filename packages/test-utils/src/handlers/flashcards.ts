import type {
  FlashcardCardsBody,
  FlashcardCopyBody,
  FlashcardReviewBody,
  FlashcardSetCreateBody,
  FlashcardSetDetail,
  FlashcardSetPatchBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  flashcardCards,
  flashcardSetDetail,
  flashcardSets,
  studyDone,
  studyNext,
  studyNextSecond,
} from "../fixtures/flashcards"
import { apiUrl, nextId, noContent, notFound, param, readJson } from "./utils"

function setDetailFor(id: string): FlashcardSetDetail | undefined {
  return id === flashcardSetDetail.id ? flashcardSetDetail : undefined
}

function cardsWithIds(cards: { id?: string; front: string; back: string }[]): FlashcardSetDetail["cards"] {
  return cards.map((card, index) => ({
    id: card.id ?? nextId(14),
    position: index + 1,
    front: card.front,
    back: card.back,
    state: card.id ? (flashcardCards.find((item) => item.id === card.id)?.state ?? "new") : "new",
    due_at: null,
  }))
}

export const flashcardsHandlers = [
  http.get(apiUrl("/v1/me/flashcard-sets"), () => HttpResponse.json(flashcardSets)),
  http.post(apiUrl("/v1/me/flashcard-sets/copy"), async ({ request }) => {
    const body = await readJson<FlashcardCopyBody>(request)
    if (!body.share_slug) return notFound("Share")
    return HttpResponse.json({
      ...flashcardSetDetail,
      id: nextId(12),
      source: "copied",
      due_today: 0,
      new_today: flashcardSetDetail.card_count,
    })
  }),
  http.post(apiUrl("/v1/me/flashcard-sets"), async ({ request }) => {
    const body = await readJson<FlashcardSetCreateBody>(request)
    const cards = cardsWithIds(body.cards ?? [])
    return HttpResponse.json({
      ...flashcardSetDetail,
      id: nextId(12),
      title: body.title ?? "",
      description: body.description ?? null,
      source: "manual",
      card_count: cards.length,
      due_today: 0,
      new_today: cards.length,
      cards,
    })
  }),
  http.get(apiUrl("/v1/me/flashcard-sets/:id"), ({ params }) => {
    const set = setDetailFor(param(params, "id"))
    return set ? HttpResponse.json(set) : notFound("Flash card set")
  }),
  http.patch(apiUrl("/v1/me/flashcard-sets/:id"), async ({ params, request }) => {
    const set = setDetailFor(param(params, "id"))
    if (!set) return notFound("Flash card set")
    const body = await readJson<FlashcardSetPatchBody>(request)
    return HttpResponse.json({
      ...set,
      title: body.title ?? set.title,
      description: body.description ?? set.description,
      new_per_day: body.new_per_day ?? set.new_per_day,
      reviews_per_day: body.reviews_per_day ?? set.reviews_per_day,
    })
  }),
  http.delete(apiUrl("/v1/me/flashcard-sets/:id"), () => noContent()),
  http.put(apiUrl("/v1/me/flashcard-sets/:id/cards"), async ({ params, request }) => {
    const set = setDetailFor(param(params, "id"))
    if (!set) return notFound("Flash card set")
    const body = await readJson<FlashcardCardsBody>(request)
    const cards = cardsWithIds(body.cards ?? [])
    return HttpResponse.json({ ...set, card_count: cards.length, cards })
  }),
  http.get(apiUrl("/v1/me/flashcard-sets/:id/study"), ({ params }) =>
    setDetailFor(param(params, "id")) ? HttpResponse.json(studyNext) : notFound("Flash card set"),
  ),
  // Reviewing the first card returns the second one; reviewing any other card finishes the session.
  http.post(apiUrl("/v1/me/flashcards/:cardId/review"), async ({ params, request }) => {
    await readJson<FlashcardReviewBody>(request)
    const first = flashcardCards[0]?.id
    return HttpResponse.json(param(params, "cardId") === first ? studyNextSecond : studyDone)
  }),
]
