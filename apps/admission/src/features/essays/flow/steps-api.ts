"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { essayKeys } from "../api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission"

export type EssayTarget = { institution_id: string | null; position: number; prompt: string; word_limit: number | null }

/** `GalleryItemOut`: a frozen snapshot of someone's essay; it carries no author. */
export type GalleryItem = {
  essay_id: string
  kind: string
  title: string
  prompt_text: string
  word_limit: number | null
  targets: EssayTarget[]
  version: number
  body: string
  word_count: number
  published_at: string | null
}
export type Gallery = { items: GalleryItem[]; mine: GalleryItem[] }

/** Mirrors `flowKeys.map` / `flowKeys.fit` of ./api (which imports ../api, so not imported here). */
const PROMPT_MAP_KEY = ["admission", "essays", "prompt-map"] as const
const IDEA_FIT_KEY = ["admission", "essay-fit"] as const

export const SHARING_PURPOSE = "admission_sharing"

export const flowKeys = {
  gallery: ["admission", "essays", "gallery"] as const,
  deep: (id: string) => ["admission", "essays", "deep-read", id] as const,
  reviews: (id: string) => ["admission", "essays", "reviews", id] as const,
  top: ["admission", "essays", "top"] as const,
  match: (universityId: string) => ["admission", "essays", "match", universityId] as const,
  matchList: ["admission", "essays", "match", "list"] as const,
}

export function useGallery() {
  return useQuery({
    queryKey: flowKeys.gallery,
    queryFn: ({ signal }) => getApiClient().get<Gallery>(`${BASE}/essays/gallery`, { query: { limit: 60 }, signal }),
  })
}

export function usePublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (essayId: string) => getApiClient().post<GalleryItem>(`${BASE}/essays/${seg(essayId)}/gallery`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: essayKeys.all })
      return qc.invalidateQueries({ queryKey: flowKeys.gallery })
    },
  })
}

export function useUnpublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (essayId: string) => getApiClient().delete<void>(`${BASE}/essays/${seg(essayId)}/gallery`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: essayKeys.all })
      return qc.invalidateQueries({ queryKey: flowKeys.gallery })
    },
  })
}

export type ParagraphRole = "hook" | "context" | "turn" | "evidence" | "insight" | "close"
export type ParagraphStrength = "strong" | "ok" | "weak"
export type DeepRead = {
  paragraphs: { paragraph: number; role: ParagraphRole; reveals: string; strength: ParagraphStrength }[]
  uniqueness: number
  uniqueness_note: string
  tropes: string[]
  moments: { paragraph: number; quote: string; kind: "surprising" | "fresh" | "earned" }[]
  fix_paragraph: number
  fix_dimension: string
  fix_problem: string
  fix_try: string
}
export type DeepReadOut = { read: DeepRead | null; cached: boolean; stale: boolean }

export function useDeepRead(essayId: string | null) {
  return useQuery({
    queryKey: flowKeys.deep(essayId ?? ""),
    enabled: !!essayId,
    queryFn: ({ signal }) =>
      getApiClient().get<DeepReadOut>(`${BASE}/essays/${seg(essayId ?? "")}/deep-read`, { signal }),
  })
}

export function useRunDeepRead(essayId: string) {
  const locale = useLocale()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (refresh: boolean) =>
      getApiClient().post<DeepReadOut>(
        `${BASE}/essays/${seg(essayId)}/deep-read`,
        { refresh },
        { headers: { "Accept-Language": locale } },
      ),
    onSuccess: (data) => qc.setQueryData(flowKeys.deep(essayId), data),
  })
}

export type UniReview = {
  alignment: number
  fit_summary: string
  goals: string[]
  risks: string[]
  sourced: boolean
  supplement_tips: string[]
}
export type UniEntry = { institution_id: string; name: string; cached: boolean; stale: boolean; review: UniReview }
export type EssayReviews = { base: unknown; base_cached: boolean; base_stale: boolean; universities: UniEntry[] }

/** The stored per-university reviews of an essay; never calls the model. */
export function useStoredReviews(essayId: string | null) {
  return useQuery({
    queryKey: flowKeys.reviews(essayId ?? ""),
    enabled: !!essayId,
    queryFn: ({ signal }) =>
      getApiClient().get<EssayReviews>(`${BASE}/essays/${seg(essayId ?? "")}/reviews`, { signal }),
  })
}

export function useGroupCritique(essayId: string) {
  const locale = useLocale()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (refresh: boolean) =>
      getApiClient().post<EssayReviews>(
        `${BASE}/essays/${seg(essayId)}/group-critique`,
        { refresh },
        { headers: { "Accept-Language": locale } },
      ),
    onSuccess: (data) => qc.setQueryData(flowKeys.reviews(essayId), data),
  })
}

export type TopEssay = {
  essay_id: string
  title: string
  kind: string
  word_count: number
  score: number
  band: string
}
export type MatchCandidate = {
  essay_id: string
  title: string
  kind: string
  word_count: number
  alignment: number | null
  target_match: boolean
}
export type AssignedEssay = {
  essay_id: string
  kind: string
  over_limit: boolean
  status: string
  title: string
  word_count: number
}
export type MatchSlot = {
  slot: string
  prompt: string | null
  word_limit: number | null
  required: boolean
  essay_id: string | null
  assigned: AssignedEssay | null
  candidates: MatchCandidate[]
  category: string | null
  prompt_key: string | null
  /** The Common App personal statement: one essay for every Common App university. */
  shared: boolean
  short_answer: ShortAnswer | null
}
export type ShortAnswer = { prompt_key: string; text: string; word_count: number; updated_at: string | null }
export type MatchTable = {
  institution_id: string
  institution_name: string
  due_utc: string | null
  due_predicted: boolean
  slots: MatchSlot[]
}

export function useTopEssays() {
  return useQuery({
    queryKey: flowKeys.top,
    queryFn: ({ signal }) => getApiClient().get<{ items: TopEssay[] }>(`${BASE}/essays/top`, { signal }),
  })
}

export function useMatchTable(universityId: string | null) {
  return useQuery({
    queryKey: flowKeys.match(universityId ?? ""),
    enabled: !!universityId,
    queryFn: ({ signal }) =>
      getApiClient().get<MatchTable>(`${BASE}/essays/match/${seg(universityId ?? "")}`, { signal }),
  })
}

/** Every listed university's slots at once, with the application due date. */
export function useMatchList() {
  return useQuery({
    queryKey: flowKeys.matchList,
    queryFn: ({ signal }) => getApiClient().get<{ items: MatchTable[] }>(`${BASE}/essays/match`, { signal }),
  })
}

/** Puts an essay into a university's slot, or empties the slot when `essayId` is null. */
export function useAssignSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ universityId, slot, essayId }: { universityId: string; slot: string; essayId: string | null }) => {
      const url = `${BASE}/essays/match/${seg(universityId)}/slots/${seg(slot)}`
      return essayId
        ? getApiClient().put<MatchTable>(url, { essay_id: essayId })
        : getApiClient().delete<MatchTable>(url)
    },
    onSuccess: (data, { universityId }) => {
      qc.setQueryData(flowKeys.match(universityId), data)
      void qc.invalidateQueries({ queryKey: flowKeys.matchList })
      void qc.invalidateQueries({ queryKey: PROMPT_MAP_KEY })
      void qc.invalidateQueries({ queryKey: IDEA_FIT_KEY })
    },
  })
}

/** Fills or empties the one personal statement shared by every Common App university. */
export function useAssignCommonApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (essayId: string | null) =>
      getApiClient().put<unknown>(`${BASE}/essays/match/common-app`, { essay_id: essayId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admission", "essays", "match"] })
      void qc.invalidateQueries({ queryKey: PROMPT_MAP_KEY })
      void qc.invalidateQueries({ queryKey: IDEA_FIT_KEY })
    },
  })
}

/** Stores a short answer; the server refuses more than 150 words or the prompt's limit with 422. */
export function useSaveShortAnswer() {
  return useMutation({
    mutationFn: ({ promptKey, text }: { promptKey: string; text: string }) =>
      getApiClient().put<ShortAnswer>(`${BASE}/essays/short-answers/${seg(promptKey)}`, { text }),
  })
}
