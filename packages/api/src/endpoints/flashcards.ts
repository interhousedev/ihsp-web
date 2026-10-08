// Flash cards (student).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type {
  FlashcardCardsBody,
  FlashcardCopyBody,
  FlashcardReviewBody,
  FlashcardSetCreateBody,
  FlashcardSetDetail,
  FlashcardSetItem,
  FlashcardSetPatchBody,
  StudyNext,
} from "../types/flashcards"

/** GET /v1/me/flashcard-sets — student. */
export function getMeFlashcardSets(opts?: RequestOptions): Promise<FlashcardSetItem[]> {
  return api.get<FlashcardSetItem[]>("/v1/me/flashcard-sets", opts)
}
export const getMeFlashcardSetsQuery = () =>
  queryOptions({ queryKey: keys.flashcards.sets(), queryFn: ({ signal }) => getMeFlashcardSets({ signal }) })

/** POST /v1/me/flashcard-sets — student. */
export function postMeFlashcardSets(body: FlashcardSetCreateBody, opts?: RequestOptions): Promise<FlashcardSetDetail> {
  return api.post<FlashcardSetDetail>("/v1/me/flashcard-sets", body, opts)
}

/** GET /v1/me/flashcard-sets/{id} — owner. */
export function getMeFlashcardSet(id: string, opts?: RequestOptions): Promise<FlashcardSetDetail> {
  return api.get<FlashcardSetDetail>(`/v1/me/flashcard-sets/${seg(id)}`, opts)
}
export const getMeFlashcardSetQuery = (id: string) =>
  queryOptions({
    queryKey: keys.flashcards.set(id),
    queryFn: ({ signal }) => getMeFlashcardSet(id, { signal }),
  })

/** PATCH /v1/me/flashcard-sets/{id} — owner. */
export function patchMeFlashcardSet(
  id: string,
  body: FlashcardSetPatchBody,
  opts?: RequestOptions,
): Promise<FlashcardSetDetail> {
  return api.patch<FlashcardSetDetail>(`/v1/me/flashcard-sets/${seg(id)}`, body, opts)
}

/** DELETE /v1/me/flashcard-sets/{id} — owner; `204`. */
export function deleteMeFlashcardSet(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/me/flashcard-sets/${seg(id)}`, opts)
}

/** PUT /v1/me/flashcard-sets/{id}/cards — owner; the full ordered list (missing ids are deleted). */
export function putMeFlashcardSetCards(
  id: string,
  body: FlashcardCardsBody,
  opts?: RequestOptions,
): Promise<FlashcardSetDetail> {
  return api.put<FlashcardSetDetail>(`/v1/me/flashcard-sets/${seg(id)}/cards`, body, opts)
}

/** GET /v1/me/flashcard-sets/{id}/study — owner; the next card to study. */
export function getMeFlashcardSetStudy(id: string, opts?: RequestOptions): Promise<StudyNext> {
  return api.get<StudyNext>(`/v1/me/flashcard-sets/${seg(id)}/study`, opts)
}
export const getMeFlashcardSetStudyQuery = (id: string) =>
  queryOptions({
    queryKey: keys.flashcards.study(id),
    queryFn: ({ signal }) => getMeFlashcardSetStudy(id, { signal }),
  })

/** POST /v1/me/flashcards/{card_id}/review — owner; returns the next card. */
export function postMeFlashcardReview(
  cardId: string,
  body: FlashcardReviewBody,
  opts?: RequestOptions,
): Promise<StudyNext> {
  return api.post<StudyNext>(`/v1/me/flashcards/${seg(cardId)}/review`, body, opts)
}

/** POST /v1/me/flashcard-sets/copy — student; copies a shared set by its share slug. */
export function postMeFlashcardSetsCopy(body: FlashcardCopyBody, opts?: RequestOptions): Promise<FlashcardSetDetail> {
  return api.post<FlashcardSetDetail>("/v1/me/flashcard-sets/copy", body, opts)
}

// --- Names used by the app plans ---

export const listFlashcardSets = getMeFlashcardSets
export const postFlashcardSet = postMeFlashcardSets
export const getFlashcardSet = getMeFlashcardSet
export const patchFlashcardSet = patchMeFlashcardSet
export const putFlashcardCards = putMeFlashcardSetCards
export const getStudyNext = getMeFlashcardSetStudy
export const postReview = postMeFlashcardReview
export const postFlashcardCopy = postMeFlashcardSetsCopy
