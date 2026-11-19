"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** Mirrors the essay-invites `FeedbackOut`: a guest's comment, possibly anchored to a passage. */
export type EssayFeedback = {
  id: string
  author_name: string
  body: string
  quote: string | null
  detached: boolean
  mine: boolean
  parent_id: string | null
  invite_label: string | null
  audience: "classmate" | "parent" | "counselor" | "other" | null
  created_at: string
  resolved_at: string | null
}

export function useEssayFeedback(essayId: string) {
  return useQuery({
    queryKey: ["admission", "essay-feedback", essayId] as const,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: EssayFeedback[] }>(`/v1/admission/essays/${seg(essayId)}/feedback`, { signal }),
  })
}
