"use client"

// `/v1/admission/career/admin/*`: the inventory questions and the majors taxonomy, inactive rows included.

import { type AdmissionCareerMajor, type AdmissionCareerQuestion, getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type CareerQuestion = AdmissionCareerQuestion
export type CareerMajor = AdmissionCareerMajor
export type QuestionInput = Omit<CareerQuestion, "id">
export type MajorInput = Omit<CareerMajor, "id">

export const SECTIONS = ["interests", "values", "skills"] as const

const BASE = "/v1/admission/career/admin"
const ROOT = ["admission", "career"] as const

export function useAdminQuestions() {
  return useQuery({
    queryKey: [...ROOT, "admin", "questions"],
    queryFn: () => getApiClient().get<{ items: CareerQuestion[] }>(`${BASE}/questions`),
  })
}

export function useAdminMajors() {
  return useQuery({
    queryKey: [...ROOT, "admin", "majors"],
    queryFn: () => getApiClient().get<{ items: CareerMajor[] }>(`${BASE}/majors`),
  })
}

/** The student-facing lists and plans read the same rows, so every key under `career` is refreshed. */
function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ROOT })
}

export function useSaveQuestion() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: QuestionInput }) =>
      id
        ? getApiClient().put<CareerQuestion>(`${BASE}/questions/${seg(id)}`, input)
        : getApiClient().post<CareerQuestion>(`${BASE}/questions`, input),
    onSuccess: invalidate,
  })
}

export function useSaveMajor() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: MajorInput }) =>
      id
        ? getApiClient().put<CareerMajor>(`${BASE}/majors/${seg(id)}`, input)
        : getApiClient().post<CareerMajor>(`${BASE}/majors`, input),
    onSuccess: invalidate,
  })
}
