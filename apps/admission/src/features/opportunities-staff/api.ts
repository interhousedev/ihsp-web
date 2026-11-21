"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/opportunities"
const KEY = ["admission", "staff-opportunities"] as const

export type StaffOppState = "all" | "live" | "archived"

export type StaffOppRow = {
  id: string
  kind: string
  title: string
  provider: string | null
  url: string | null
  logo_url: string | null
  country: string | null
  registration_deadlines: string[]
  exam_dates: string[]
  archived: boolean
  updated_at: string
  lock_version: number
}

export type StaffOppPage = { items: StaffOppRow[]; total: number; page: number; page_size: number }

/** Every editable field of an entry; unedited fields are sent back as loaded. */
export type StaffOppFields = { kind: string; title: string } & Record<string, unknown>

export type StaffOppDetail = {
  id: string
  fields: StaffOppFields
  archived: boolean
  in_use: boolean
  lock_version: number
  created_at: string
  updated_at: string
}

export type StaffOppQuery = { q: string; kind: string; state: StaffOppState; page: number; pageSize: number }

/** GET /staff/opportunities: live and archived entries, one page. */
export function useStaffOpportunities(q: StaffOppQuery) {
  return useQuery({
    queryKey: [...KEY, "list", q] as const,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      getApiClient().get<StaffOppPage>(BASE, {
        query: {
          ...(q.q.trim() ? { q: q.q.trim() } : {}),
          ...(q.kind ? { kind: q.kind } : {}),
          state: q.state,
          page: q.page,
          page_size: q.pageSize,
        },
        signal,
      }),
  })
}

export function useStaffOpportunity(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "one", id] as const,
    enabled: id !== null,
    queryFn: ({ signal }) => getApiClient().get<StaffOppDetail>(`${BASE}/${encodeURIComponent(id ?? "")}`, { signal }),
  })
}

export function useStaffOpportunityMutations() {
  const client = useQueryClient()
  const done = () => client.invalidateQueries({ queryKey: KEY })
  const create = useMutation({
    mutationFn: (fields: StaffOppFields) => getApiClient().post<StaffOppDetail>(BASE, { fields }),
    onSuccess: done,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; fields: StaffOppFields; lock_version: number }) =>
      getApiClient().put<StaffOppDetail>(`${BASE}/${encodeURIComponent(v.id)}`, {
        fields: v.fields,
        lock_version: v.lock_version,
      }),
    onSuccess: done,
  })
  const visibility = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) =>
      getApiClient().post<StaffOppDetail>(`${BASE}/${encodeURIComponent(v.id)}/visibility`, { archived: v.archived }),
    onSuccess: done,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/${encodeURIComponent(id)}`),
    onSuccess: done,
  })
  return { create, update, visibility, remove }
}
