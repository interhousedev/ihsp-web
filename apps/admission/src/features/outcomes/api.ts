"use client"

import {
  type AdmissionOutcome,
  type AdmissionOutcomeIn,
  type AdmissionOutcomeList,
  type AdmissionOutcomePatch,
  type AdmissionOutcomeSummary,
  type AdmissionOutcomeTally,
  getApiClient,
  seg,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/outcomes"

export type Outcome = AdmissionOutcome
export type OutcomeIn = AdmissionOutcomeIn
export type OutcomePatch = AdmissionOutcomePatch
export type OutcomeSummaryData = AdmissionOutcomeSummary
export type OutcomeTally = AdmissionOutcomeTally

export const OUTCOME_STATUSES = ["applied", "accepted", "waitlisted", "deferred", "rejected", "enrolled"] as const
export const OUTCOME_PLANS = ["ed", "ed2", "ea", "rea", "rd", "rolling", "other"] as const

export const OUTCOMES_KEY = ["admission", "outcomes"] as const

export function useOutcomes() {
  return useQuery({
    queryKey: [...OUTCOMES_KEY, "mine"] as const,
    queryFn: () =>
      getApiClient()
        .get<AdmissionOutcomeList>(BASE)
        .then((page) => page.items),
  })
}

/** Aggregate and opted-in names, for every university or for one. */
export function useOutcomeSummary(institutionId?: string, enabled = true) {
  return useQuery({
    queryKey: [...OUTCOMES_KEY, "summary", institutionId ?? "all"] as const,
    enabled,
    queryFn: () =>
      getApiClient().get<OutcomeSummaryData>(`${BASE}/summary`, {
        query: institutionId ? { institution_id: institutionId } : undefined,
      }),
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: OUTCOMES_KEY })
}

export function useCreateOutcome() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: OutcomeIn) => getApiClient().post<Outcome>(BASE, body),
    onSuccess: invalidate,
  })
}

export function useUpdateOutcome() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: OutcomePatch & { id: string }) =>
      getApiClient().patch<Outcome>(`${BASE}/${seg(id)}`, body),
    onSuccess: invalidate,
  })
}

export function useDeleteOutcome() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/${seg(id)}`),
    onSuccess: invalidate,
  })
}

export type OutcomeStatus = (typeof OUTCOME_STATUSES)[number]
export type OutcomePlan = (typeof OUTCOME_PLANS)[number]
