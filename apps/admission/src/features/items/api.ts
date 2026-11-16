"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type ItemKind = "activity" | "honor"
export type Horizon = "current" | "projected"
export const DIMENSIONS = ["clarity", "role_name", "impact", "alignment"] as const
export type Dimension = (typeof DIMENSIONS)[number]

export type Metric = {
  id: string
  label: string
  value: string
  unit: string
  horizon: string
  as_of: string | null
  target_date: string | null
  provenance: string
}

export type MetricInput = {
  label: string
  value: number | string
  unit: string
  horizon: Horizon
  target_date?: string | null
}

export type ReviewDimension = { dim: string; grade: string; evidence: string; suggestion: string }
export type Rewrite = { position: string; org: string; description: string }

/** Mirrors `ReviewOut`; `payload` is empty with `safety_flag: "safeguarding"`. */
export type Review = {
  id: string
  target_id: string
  grades: Record<string, string>
  overall: string | null
  payload: {
    dimensions?: ReviewDimension[]
    rewrite?: Rewrite | null
    missing_facts?: string[]
    message_key?: string
  }
  safety_flag: string
  status: string
  created_at: string
}

/** Mirrors `ItemOut`. */
export type Item = {
  id: string
  kind: string
  title: string
  organization: string
  description: string
  category: string | null
  grades: number[]
  hours_per_week: number | null
  weeks_per_year: number | null
  position: number
  lock_version: number
  metrics: Metric[]
  review: Review | null
  review_stale: boolean
}

export type ItemInput = {
  kind: ItemKind
  title: string
  organization: string
  description: string
  category?: string | null
  grades: number[]
  hours_per_week: number | null
  weeks_per_year: number | null
}

export type InterviewQuestion = { gap?: string; question: string; why_it_matters?: string; options?: string[] }
export type Interview = {
  item_id: string
  rounds: {
    round: number
    questions: { questions?: InterviewQuestion[] } & Record<string, unknown>
    answers: Record<string, string>
  }[]
  ready: boolean
  proposal: Rewrite | null
  safeguarding: boolean
}

export const itemKeys = {
  all: ["admission", "items"] as const,
  list: (kind?: ItemKind) => ["admission", "items", "list", kind ?? "all"] as const,
  interview: (id: string) => ["admission", "items", "interview", id] as const,
}

const BASE = "/v1/admission/me"

export function useItems(kind?: ItemKind) {
  return useQuery({
    queryKey: itemKeys.list(kind),
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: Item[] }>(`${BASE}/items`, { query: kind ? { kind } : undefined, signal }),
    select: (data) => data.items,
  })
}

export function useItem(id: string | null) {
  const list = useItems()
  return { ...list, data: id ? list.data?.find((i) => i.id === id) : undefined }
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: itemKeys.all })
}

export function useCreateItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: ItemInput) => getApiClient().post<Item>(`${BASE}/items`, body),
    onSuccess: invalidate,
  })
}

export function usePatchItem(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: Partial<ItemInput> & { lock_version: number }) =>
      getApiClient().patch<Item>(`${BASE}/items/${seg(id)}`, body),
    onSuccess: invalidate,
  })
}

export function useDeleteItem() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/items/${seg(id)}`),
    onSuccess: invalidate,
  })
}

/** Sends the new order of one kind; the cache is replaced at once and settles from the response. */
export function useReorderItems() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => getApiClient().put<{ items: Item[] }>(`${BASE}/items/order`, { ids }),
    onSettled: () => qc.invalidateQueries({ queryKey: itemKeys.all }),
  })
}

export function useSetMetrics(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (metrics: MetricInput[]) =>
      getApiClient().put<{ items: Metric[] }>(`${BASE}/items/${seg(id)}/metrics`, { metrics }),
    onSuccess: invalidate,
  })
}

export function useReview(id: string) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: () => getApiClient().post<Review>(`${BASE}/items/${seg(id)}/review`),
    onSuccess: invalidate,
  })
}

export function useReviewFeedback(reviewId: string) {
  return useMutation({
    mutationFn: (body: { kind: "unfair" | "helpful"; note?: string }) =>
      getApiClient().post<unknown>(`${BASE}/reviews/${seg(reviewId)}/feedback`, body),
  })
}

export function useInterview(id: string, enabled: boolean) {
  return useQuery({
    queryKey: itemKeys.interview(id),
    enabled,
    queryFn: ({ signal }) => getApiClient().get<Interview>(`${BASE}/items/${seg(id)}/interview`, { signal }),
  })
}

export function usePostInterview(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { answers: Record<string, string>; restart?: boolean }) =>
      getApiClient().post<Interview>(`${BASE}/items/${seg(id)}/interview`, body),
    onSuccess: (data) => qc.setQueryData(itemKeys.interview(id), data),
  })
}
