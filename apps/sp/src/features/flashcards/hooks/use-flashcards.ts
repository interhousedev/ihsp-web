"use client"

import {
  deleteMeFlashcardSet,
  getMeFlashcardSetQuery,
  getMeFlashcardSetStudyQuery,
  getMeFlashcardSetsQuery,
  getMeFlashcardSetsStatsQuery,
  keys,
  patchMeFlashcardSet,
  postMeFlashcardReview,
  postMeFlashcardSets,
  postMeFlashcardSetsCopy,
  putMeFlashcardSetCards,
  type FlashcardCardsBody,
  type FlashcardSetCreateBody,
  type FlashcardSetDetail,
  type FlashcardSetPatchBody,
  type ReviewRating,
  type StudyNext,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

export function useFlashcardSets() {
  return useQuery(getMeFlashcardSetsQuery())
}

export function useFlashcardSet(id: string | null) {
  return useQuery({ ...getMeFlashcardSetQuery(id ?? ""), enabled: id !== null })
}

/** The review heatmap and streaks of one set, or of all sets when `setId` is null; `year` null means this year. */
export function useFlashcardStats(setId: string | null, year: number | null, enabled = true) {
  return useQuery({
    ...getMeFlashcardSetsStatsQuery({ ...(setId ? { set_id: setId } : {}), ...(year ? { year } : {}) }),
    enabled,
    placeholderData: (previous) => previous,
  })
}

export function useStudyNext(id: string | null) {
  return useQuery({ ...getMeFlashcardSetStudyQuery(id ?? ""), enabled: id !== null, staleTime: 0 })
}

/** A detail response of the owner's set updates the cached detail and refreshes the list. */
function storeDetail(queryClient: QueryClient, detail: FlashcardSetDetail) {
  queryClient.setQueryData(keys.flashcards.set(detail.id), detail)
  void queryClient.invalidateQueries({ queryKey: keys.flashcards.sets(), exact: true })
  void queryClient.invalidateQueries({ queryKey: keys.flashcards.study(detail.id) })
}

export function useCreateFlashcardSet() {
  const queryClient = useQueryClient()
  return useMutation<FlashcardSetDetail, unknown, FlashcardSetCreateBody>({
    mutationFn: (body) => postMeFlashcardSets(body),
    onSuccess: (detail) => storeDetail(queryClient, detail),
  })
}

export function useUpdateFlashcardSet(id: string) {
  const queryClient = useQueryClient()
  return useMutation<FlashcardSetDetail, unknown, FlashcardSetPatchBody>({
    mutationFn: (body) => patchMeFlashcardSet(id, body),
    onSuccess: (detail) => storeDetail(queryClient, detail),
  })
}

export function useSaveFlashcardCards(id: string) {
  const queryClient = useQueryClient()
  return useMutation<FlashcardSetDetail, unknown, FlashcardCardsBody>({
    mutationFn: (body) => putMeFlashcardSetCards(id, body),
    onSuccess: (detail) => storeDetail(queryClient, detail),
  })
}

export function useDeleteFlashcardSet() {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteMeFlashcardSet(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: keys.flashcards.set(id) })
      void queryClient.invalidateQueries({ queryKey: keys.flashcards.sets(), exact: true })
    },
  })
}

export function useCopyFlashcardSet() {
  const queryClient = useQueryClient()
  return useMutation<FlashcardSetDetail, unknown, string>({
    mutationFn: (shareSlug) => postMeFlashcardSetsCopy({ share_slug: shareSlug }),
    onSuccess: (detail) => storeDetail(queryClient, detail),
  })
}

/** Rates a card; the answer is the next card, which replaces the cached study state. */
export function useReviewFlashcard(setId: string) {
  const queryClient = useQueryClient()
  return useMutation<StudyNext, unknown, { cardId: string; rating: ReviewRating; durationMs?: number }>({
    mutationFn: ({ cardId, rating, durationMs }) =>
      postMeFlashcardReview(cardId, {
        rating,
        ...(durationMs === undefined ? {} : { duration_ms: Math.round(durationMs) }),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(keys.flashcards.study(setId), next)
      // The counts of the deck list and the overview, and the heatmap, change with every answer.
      void queryClient.invalidateQueries({ queryKey: keys.flashcards.sets(), exact: true })
      void queryClient.invalidateQueries({ queryKey: keys.flashcards.set(setId), exact: true })
      void queryClient.invalidateQueries({ queryKey: keys.flashcards.allStats() })
    },
  })
}
