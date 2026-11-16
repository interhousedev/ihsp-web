"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission"

export type Milestone = {
  id: string
  list_entry_id: string
  kind: string
  due_utc: string | null
  predicted: boolean
  institution_id: string
  institution_name: string
}

export type Deadline = {
  id: string
  institution_id: string
  cycle: number
  round: string
  program_id: string | null
  precision: string
  source_text: string | null
  source_tz: string | null
  local_date: string | null
  cutoff_time: string | null
  instant_utc: string | null
  binding: boolean
  applies_to: string | null
  status: string
  version: number
}

export type DeadlineBody = {
  status?: string | null
  precision?: string | null
  source_text?: string | null
  local_date?: string | null
  cutoff_time?: string | null
  source_tz?: string | null
  binding?: boolean | null
}

export type ReminderPrefs = { offsets_days: number[]; channels: string[]; quiet_from: string; quiet_to: string }

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
    onSuccess: () => client.invalidateQueries({ queryKey: STAFF_DEADLINES_KEY }),
  })
}

export type DeadlineCreateBody = DeadlineBody & { institution_id: string; cycle: number; round: string }
export type InstitutionHit = { id: string; name: string; country: string }

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
