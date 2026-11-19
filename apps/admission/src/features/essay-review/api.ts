"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** Mirrors `EssayReviewsOut` of the admission contract. */
export type EssayReviews = {
  base: BaseReview | null
  base_cached: boolean
  base_stale: boolean
  universities: UniReviewEntry[]
}
export type BaseReview = {
  summary: string
  score: number
  band: string
  dimensions: { key: string; score: number; comment: string; quote: string | null }[]
  strengths: string[]
  improvements: string[]
}
export type UniReviewEntry = {
  institution_id: string
  name: string
  cached: boolean
  stale: boolean
  review: {
    alignment: number
    fit_summary: string
    goals: {
      key: string
      goal: string
      alignment: "strong" | "partial" | "missing"
      evidence: string | null
      suggestion: string
    }[]
    risks: string[]
    supplement_tips: string[]
  }
}

/** Universities per run, as the contract allows. */
export const MAX_REVIEW_INSTITUTIONS = 5

const path = (essayId: string) => `/v1/admission/essays/${seg(essayId)}/reviews`
const key = (essayId: string) => ["admission", "essays", essayId, "reviews"] as const

/** The latest stored reviews, shown as soon as the panel opens. */
export function useStoredReviews(essayId: string) {
  return useQuery({
    queryKey: key(essayId),
    queryFn: ({ signal }) => getApiClient().get<EssayReviews>(path(essayId), { signal }),
  })
}

/** Runs (or refreshes) the base review and one review per chosen university. */
export function useRunReviews(essayId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: { institution_ids: string[]; refresh: boolean }) =>
      getApiClient().post<EssayReviews>(path(essayId), body),
    onSuccess: (data) => client.setQueryData(key(essayId), data),
  })
}
