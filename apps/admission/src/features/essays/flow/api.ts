"use client"

import {
  type AdmissionEssayFork,
  type AdmissionIdeaFit,
  type AdmissionPracticeEntry,
  type AdmissionPracticeToday,
  type AdmissionPromptMap,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale } from "@ihsp/i18n"
import { essayKeys } from "../api"

const BASE = "/v1/admission/essays"

export type PromptMap = AdmissionPromptMap
export type PromptGroup = PromptMap["groups"][number]
export type PromptRef = PromptGroup["prompts"][number]
export type IdeaFit = AdmissionIdeaFit
export type PracticeToday = AdmissionPracticeToday
export type PracticeEntry = AdmissionPracticeEntry

export type PromptScope = "list" | "all"

export const flowKeys = {
  map: [...essayKeys.all, "prompt-map"] as const,
  scopedMap: (scope: PromptScope, locale: string) => [...essayKeys.all, "prompt-map", scope, locale] as const,
  fit: (text: string) => ["admission", "essay-fit", text] as const,
  today: [...essayKeys.all, "practice", "today"] as const,
  practice: [...essayKeys.all, "practice", "list"] as const,
}

/** The prompt groups of one scope: `list` is my universities plus the Common App, `all` the whole catalog. */
export function usePromptMap(scope: PromptScope = "all") {
  const locale = useLocale()
  return useQuery({
    queryKey: flowKeys.scopedMap(scope, locale),
    queryFn: ({ signal }) =>
      getApiClient().get<PromptMap>(`${BASE}/prompt-map`, {
        query: { scope },
        headers: { "Accept-Language": locale },
        signal,
      }),
  })
}

/** The stored fit of one idea to the prompts no essay covers yet; opening the page never calls the model. */
export function ideaFitOptions(text: string, enabled: boolean) {
  return {
    queryKey: flowKeys.fit(text),
    enabled: enabled && text.trim().length > 0,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: () => getApiClient().post<IdeaFit>(`${BASE}/ideas/fit`, { text, cached_only: true }),
  }
}

/** Scores one idea with the model (AI consent) and stores the result where the cached read finds it. */
export function useRunIdeaFit(text: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => getApiClient().post<IdeaFit>(`${BASE}/ideas/fit`, { text }),
    onSuccess: (fit) => qc.setQueryData(flowKeys.fit(text), fit),
  })
}

export function useIdeaFit(text: string, enabled: boolean) {
  return useQuery(ideaFitOptions(text, enabled))
}

export function usePracticeToday() {
  return useQuery({
    queryKey: flowKeys.today,
    queryFn: ({ signal }) => getApiClient().get<PracticeToday>(`${BASE}/practice/today`, { signal }),
  })
}

export function usePracticeHistory() {
  return useQuery({
    queryKey: flowKeys.practice,
    queryFn: ({ signal }) => getApiClient().get<{ items: PracticeEntry[] }>(`${BASE}/practice`, { signal }),
  })
}

export function useSavePractice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => getApiClient().put<PracticeToday>(`${BASE}/practice/today`, { body }),
    onSuccess: (today) => {
      qc.setQueryData(flowKeys.today, today)
      void qc.invalidateQueries({ queryKey: flowKeys.practice })
    },
  })
}

export function useEvaluatePractice() {
  const locale = useLocale()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      getApiClient().post<PracticeToday>(
        `${BASE}/practice/today/evaluate`,
        {},
        { headers: { "Accept-Language": locale } },
      ),
    onSuccess: (today) => {
      qc.setQueryData(flowKeys.today, today)
      void qc.invalidateQueries({ queryKey: flowKeys.practice })
    },
  })
}

export function useForkEssay(essayId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { institution_id: string | null; position: number }) =>
      getApiClient().post<AdmissionEssayFork>(`${BASE}/${seg(essayId)}/fork`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admission", "essay-fit"] })
      return qc.invalidateQueries({ queryKey: essayKeys.all })
    },
  })
}
