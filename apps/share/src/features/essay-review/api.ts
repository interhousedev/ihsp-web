import { api } from "@ihsp/api"

export type ReviewAudience = "classmate" | "parent" | "counselor" | "other"

/** Mirrors `GuestCommentOut`. */
export type ReviewComment = {
  id: string
  author_name: string
  body: string
  created_at: string
  resolved: boolean
  detached: boolean
  quote: string | null
  parent_id: string | null
  anchor_start: number | null
  anchor_end: number | null
}

/** Mirrors `GuestReviewOut`. */
export type ReviewView = {
  audience: ReviewAudience
  can_comment: boolean
  expires_at: string
  essay: { title: string; kind: string; prompt_text: string; body: string; word_count: number }
  comments: ReviewComment[]
}

const BASE = "/v1/public/admission/essay-review"

export const openReview = (token: string, signal?: AbortSignal): Promise<ReviewView> =>
  api.request({ method: "POST", path: `${BASE}/open`, auth: "none", body: { token }, signal })

export const addReviewComment = (token: string, body: { author_name: string; body: string }): Promise<ReviewComment> =>
  api.request({ method: "POST", path: `${BASE}/comments`, auth: "none", body: { token, ...body } })
