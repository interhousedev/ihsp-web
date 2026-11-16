"use client"

import {
  type AdmissionScoreCatalog,
  type AdmissionScoreEntry,
  type AdmissionScoreEntryIn,
  type AdmissionScoreOverview,
  type AdmissionScoreTest,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission"

export const SCORE_STATUSES = ["planned", "registered", "taken", "score_received"] as const
export type ScoreStatus = (typeof SCORE_STATUSES)[number]
export type ScoreValue = number | string

export type ScoreCatalog = AdmissionScoreCatalog
export type ScoreTest = AdmissionScoreTest
export type ScoreSection = ScoreTest["sections"][number]
export type ScoreEntryInput = AdmissionScoreEntryIn
export type ScoreEntry = AdmissionScoreEntry
export type ScoreOverview = AdmissionScoreOverview
export type ScoreSummary = ScoreOverview["summaries"][number]

export const SCORES_KEY = ["admission", "test-scores"] as const
const CATALOG_KEY = [...SCORES_KEY, "catalog"] as const

/** A name in the UI language, falling back to English or any filled locale. */
export function scoreName(names: Record<string, string>, locale: string): string {
  return names[locale] || names.en || Object.values(names)[0] || ""
}

export function useScoreCatalog() {
  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: () => getApiClient().get<ScoreCatalog>(`${BASE}/test-scores/catalog`),
  })
}

/** The caller's entries, or a student's (staff with access) when `studentId` is given. */
export function useScores(studentId?: string) {
  return useQuery({
    queryKey: [...SCORES_KEY, "list", studentId ?? "me"],
    queryFn: () =>
      getApiClient().get<ScoreOverview>(
        studentId ? `${BASE}/students/${seg(studentId)}/test-scores` : `${BASE}/test-scores`,
      ),
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: SCORES_KEY })
}

export function useSaveScore() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ScoreEntryInput }) =>
      id
        ? getApiClient().put<ScoreEntry>(`${BASE}/test-scores/${seg(id)}`, input)
        : getApiClient().post<ScoreEntry>(`${BASE}/test-scores`, input),
    onSuccess: invalidate,
  })
}

export function useDeleteScore() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/test-scores/${seg(id)}`),
    onSuccess: invalidate,
  })
}

export function useVerifyScore() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      getApiClient().post<ScoreEntry>(`${BASE}/test-scores/${seg(id)}/verify`, { verified }),
    onSuccess: invalidate,
  })
}

/** Mirrors `ScoreTestIn`; the catalog is admin-editable. */
export type ScoreTestInput = Omit<ScoreTest, "id">

export const TOTAL_MODES = ["sum", "mean_int", "mean_half", "manual", "none"] as const

export function useSaveCatalogTest() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ScoreTestInput }) =>
      id
        ? getApiClient().put<ScoreTest>(`${BASE}/test-scores/catalog/${seg(id)}`, input)
        : getApiClient().post<ScoreTest>(`${BASE}/test-scores/catalog`, input),
    onSuccess: invalidate,
  })
}

export function useDeleteCatalogTest() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/test-scores/catalog/${seg(id)}`),
    onSuccess: invalidate,
  })
}
