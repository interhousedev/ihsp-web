"use client"

import {
  type AdmissionItem,
  type AdmissionItemIn,
  type AdmissionItemInterview,
  type AdmissionItemMetricIn,
  type AdmissionItemReview,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type ItemKind = AdmissionItemIn["kind"]
export type ItemStatus = NonNullable<AdmissionItemIn["status"]>
export type ItemGrade = NonNullable<AdmissionItemIn["grades"]>[number]
export type ItemTiming = NonNullable<AdmissionItemIn["timing"]>[number]
export type Metric = AdmissionItem["metrics"][number]
export type MetricInput = AdmissionItemMetricIn
export type Horizon = MetricInput["horizon"]
export const DIMENSIONS = ["clarity", "role_name", "impact", "alignment"] as const
export type Dimension = (typeof DIMENSIONS)[number]
export type ItemInput = AdmissionItemIn
export type ReviewDimension = { dim: string; grade: string; evidence: string; suggestion: string }
export type Rewrite = { position: string; org: string; description: string }

/** The contract types `payload` as an open object; empty with `safety_flag: "safeguarding"`. */
export type Review = Omit<AdmissionItemReview, "payload" | "grades"> & {
  grades: Record<string, string>
  payload: {
    dimensions?: ReviewDimension[]
    rewrite?: Rewrite | null
    missing_facts?: string[]
    message_key?: string
  }
}

/** `kind` and `status` are plain strings in the response; `review` is narrowed below. */
export type Item = Omit<AdmissionItem, "review"> & { review: Review | null }

export type InterviewQuestion = { gap?: string; question: string; why_it_matters?: string; options?: string[] }
/** The contract types questions, answers and proposal as open objects. */
export type Interview = Omit<AdmissionItemInterview, "rounds" | "proposal"> & {
  rounds: {
    round: number
    questions: InterviewQuestion[]
    answers: Record<string, string>
  }[]
  proposal: Rewrite | null
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

/** The field names of an `admission/item_incomplete` problem (`params.fields`), else none. */
export function incompleteFields(error: unknown): string[] {
  const fields = (error as { params?: { fields?: unknown } } | null)?.params?.fields
  return Array.isArray(fields) ? fields.filter((f): f is string => typeof f === "string") : []
}
