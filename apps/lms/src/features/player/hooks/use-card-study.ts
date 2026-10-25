"use client"

import { getLmsStepCardsNextQuery, keys, postLmsStepCardReview, type LmsCardStudy, type ReviewRating } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query"
import { useState } from "react"

export type CardStudy = {
  /** The query of the next card: loading and error states. */
  next: UseQueryResult<LmsCardStudy>
  /** What `StudyScreen` shows and needs; `card` is `null` when nothing is left. */
  card: { id: string; front: string; back: string } | null
  intervals: LmsCardStudy["intervals"]
  counts: LmsCardStudy["counts"]
  /** Cards answered in this visit; tells `StudyScreen` that the same card came back. */
  reviewed: number
  isRating: boolean
  ratingFailed: boolean
  ratingError: unknown
  /** Sends the rating; the answer of the server is the next card. The LMS keeps no study time, so there is none here. */
  rate: (rating: ReviewRating) => void
}

const NO_COUNTS: LmsCardStudy["counts"] = { new: 0, learning: 0, review: 0 }

/**
 * Adapts the LMS card API (next card, review) to the props of `StudyScreen`. A review returns the next card, which is
 * written straight into the query cache, so there is no second request between two cards.
 */
export function useCardStudy(stepId: string, blockId: string, enabled: boolean): CardStudy {
  const queryClient = useQueryClient()
  const [reviewed, setReviewed] = useState(0)
  const next = useQuery({ ...getLmsStepCardsNextQuery(stepId, blockId), enabled, staleTime: 0 })

  const review = useMutation<LmsCardStudy, unknown, { cardId: string; rating: ReviewRating }>({
    mutationFn: ({ cardId, rating }) => postLmsStepCardReview(stepId, cardId, { rating }),
    onSuccess: (study) => {
      queryClient.setQueryData(keys.lms.cardNext(stepId, blockId), study)
      setReviewed((count) => count + 1)
    },
  })

  const card = next.data?.card ?? null
  return {
    next,
    card,
    intervals: next.data?.intervals ?? null,
    counts: next.data?.counts ?? NO_COUNTS,
    reviewed,
    isRating: review.isPending,
    ratingFailed: review.isError,
    ratingError: review.error,
    rate: (rating) => {
      if (card) review.mutate({ cardId: card.id, rating })
    },
  }
}
