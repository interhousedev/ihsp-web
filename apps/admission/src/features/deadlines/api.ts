"use client"

import {
  type AdmissionDeadline,
  type AdmissionDeadlineIn,
  type AdmissionDeadlinePatchIn,
  type AdmissionMilestone,
  type AdmissionReminderPrefs,
  getApiClient,
} from "@ihsp/api"
import type { CaseloadDeadline } from "./staff-timeline-model"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission"

export type Milestone = AdmissionMilestone
export type Deadline = AdmissionDeadline
export type DeadlineBody = AdmissionDeadlinePatchIn
export type ReminderPrefs = AdmissionReminderPrefs

export const DEADLINES_KEY = ["admission", "deadlines"] as const
export const PREFS_KEY = ["admission", "reminder-prefs"] as const
export const STAFF_DEADLINES_KEY = ["admission", "staff-deadlines"] as const

export function useMyDeadlines() {
  return useQuery({ queryKey: DEADLINES_KEY, queryFn: () => getApiClient().get<Milestone[]>(`${BASE}/deadlines`) })
}

export function usePrefs() {
  return useQuery({ queryKey: PREFS_KEY, queryFn: () => getApiClient().get<ReminderPrefs>(`${BASE}/reminder-prefs`) })
}

export function useSavePrefs() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (prefs: ReminderPrefs) => getApiClient().put<ReminderPrefs>(`${BASE}/reminder-prefs`, prefs),
    onSuccess: (data) => client.setQueryData(PREFS_KEY, data),
  })
}

export function useStaffDeadlines() {
  return useQuery({
    queryKey: STAFF_DEADLINES_KEY,
    queryFn: () => getApiClient().get<Deadline[]>(`${BASE}/staff/deadlines`),
  })
}

export function useEditDeadline() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: DeadlineBody & { id: string }) =>
      getApiClient().patch<Deadline>(`${BASE}/staff/deadlines/${encodeURIComponent(id)}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: STAFF_DEADLINES_KEY }),
  })
}

export function useRemoveDeadline() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/staff/deadlines/${encodeURIComponent(id)}`),
    onSuccess: (_data, id) => {
      // The row leaves the list at once; the refetch then brings the retired (unknown) version back.
      client.setQueryData<Deadline[]>(STAFF_DEADLINES_KEY, (rows) => rows?.filter((row) => row.id !== id))
      return client.invalidateQueries({ queryKey: STAFF_DEADLINES_KEY })
    },
  })
}

export type DeadlineCreateBody = AdmissionDeadlineIn
export type InstitutionHit = {
  id: string
  name: string
  country: string
  logo_url?: string | null
  logo_fit?: "circle" | "contain"
  logo_zoom?: number
}

export function useInstitutionSearch(q: string) {
  return useQuery({
    queryKey: ["admission", "deadline-institutions", q] as const,
    enabled: q.trim().length >= 2,
    queryFn: ({ signal }) =>
      getApiClient()
        .get<{ items: InstitutionHit[] }>(`${BASE}/catalog/institutions`, { query: { q: q.trim(), limit: 8 }, signal })
        .then((page) => page.items),
  })
}

export function useCreateDeadline() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: DeadlineCreateBody) => getApiClient().post<Deadline>(`${BASE}/staff/deadlines`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: STAFF_DEADLINES_KEY }),
  })
}

export type CaseloadScope = "mine" | "all"

/** GET /v1/admission/staff/caseload-deadlines: dated items and staff tasks of the students the caller reaches. */
export function useCaseloadDeadlines(scope: CaseloadScope) {
  return useQuery({
    queryKey: ["admission", "staff-caseload-deadlines", scope] as const,
    queryFn: ({ signal }) =>
      getApiClient()
        .get<{ items: CaseloadDeadline[] }>(`${BASE}/staff/caseload-deadlines`, { query: { scope }, signal })
        .then((page) => page.items),
  })
}
