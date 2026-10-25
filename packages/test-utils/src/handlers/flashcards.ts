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
  flashcardStats,
  flashcardStatsEmpty,
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
  // Before `/flashcard-sets/:id`, or "stats" would be taken for a set id.
  http.get(apiUrl("/v1/me/flashcard-sets/stats"), ({ request }) => {
    const url = new URL(request.url)
    const year = Number(url.searchParams.get("year") ?? flashcardStats.year)
    const setId = url.searchParams.get("set_id")
    if (setId && !setDetailFor(setId)) return notFound("Flash card set")
    return HttpResponse.json(
      year === flashcardStats.year
        ? { ...flashcardStats, set_id: setId }
        : { ...flashcardStatsEmpty, year, set_id: setId },
    )
  }),
  http.post(apiUrl("/v1/me/flashcard-sets/copy"), async ({ request }) => {
    const body = await readJson<FlashcardCopyBody>(request)
    if (!body.share_slug) return notFound("Share")
    return HttpResponse.json({
      ...flashcardSetDetail,
      id: nextId(12),
      source: "copied",
      due_today: 0,
      new_today: flashcardSetDetail.card_count,
      new_count: flashcardSetDetail.card_count,
      learning_count: 0,
      due_count: 0,
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
      new_count: cards.length,
      learning_count: 0,
      due_count: 0,
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
