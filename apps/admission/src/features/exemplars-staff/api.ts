"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/exemplars"
export const EXEMPLARS_KEY = ["admission", "staff-exemplars"] as const

export const EXEMPLAR_KINDS = ["personal_statement", "supplement", "why_us", "activity", "other"] as const
export const EXEMPLAR_STATUSES = ["draft", "published", "archived"] as const
export const IMPORT_LIMIT = 50

export type ExemplarKind = (typeof EXEMPLAR_KINDS)[number]
export type ExemplarStatus = (typeof EXEMPLAR_STATUSES)[number]

/** ExemplarOut of the staff library (with the body). */
export type Exemplar = {
  id: string
  title: string
  kind: ExemplarKind
  status: ExemplarStatus
  institution_id: string | null
  school_name: string
  year: number | null
  language: string
  prompt: string
  source_name: string
  source_url: string
  notes: string
  body: string
  tags: string[]
  word_count: number
  lock_version: number
  created_at: string
  updated_at: string
}

/** ExemplarIn: a new exemplar. */
export type ExemplarInput = {
  title: string
  kind: ExemplarKind
  body: string
  source_url: string
  institution_id?: string | null
  school_name?: string
  source_name?: string
  year?: number | null
  language?: string
  prompt?: string
  notes?: string
  tags?: string[]
  status?: ExemplarStatus
}

export type ExemplarPatch = Partial<Omit<ExemplarInput, "year" | "institution_id">> & {
  lock_version: number
  year?: number | null
  institution_id?: string | null
}

export type ExemplarFilters = {
  q: string
  status: ExemplarStatus | null
  institutionId: string | null
  year: number | null
}

export type ExemplarList = { items: Exemplar[]; total: number }
export type ImportResult = { created: Exemplar[]; duplicates: string[] }

export function useExemplars(filters: ExemplarFilters) {
  return useQuery({
    queryKey: [...EXEMPLARS_KEY, filters] as const,
    queryFn: ({ signal }) =>
      getApiClient().get<ExemplarList>(BASE, {
        query: {
          limit: 200,
          ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.institutionId ? { institution_id: filters.institutionId } : {}),
        },
        signal,
      }),
    // The API has no year filter: it narrows the loaded page.
    select: (page) =>
      filters.year === null ? page : { ...page, items: page.items.filter((e) => e.year === filters.year) },
  })
}

export function useCreateExemplar() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: ExemplarInput) => getApiClient().post<Exemplar>(BASE, body),
    onSuccess: () => client.invalidateQueries({ queryKey: EXEMPLARS_KEY }),
  })
}

export function usePatchExemplar() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: ExemplarPatch & { id: string }) =>
      getApiClient().patch<Exemplar>(`${BASE}/${seg(id)}`, body),
    onSuccess: () => client.invalidateQueries({ queryKey: EXEMPLARS_KEY }),
  })
}

export function useImportExemplars() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (items: ExemplarInput[]) => getApiClient().post<ImportResult>(`${BASE}/import`, { items }),
    onSuccess: () => client.invalidateQueries({ queryKey: EXEMPLARS_KEY }),
  })
}
