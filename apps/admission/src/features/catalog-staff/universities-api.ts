"use client"

import { getApiClient } from "@ihsp/api"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/catalog/institutions"
const KEY = ["admission", "staff-institutions"] as const

export type InstitutionStatus = "published" | "provisional" | "archived"

export type StaffInstitution = {
  id: string
  name: string
  name_local: string | null
  country: string
  city: string | null
  website_domain: string | null
  kind: "university" | "college" | "foundation_provider"
  size_band: string | null
  setting: "big_city" | "college_town" | "campus" | "small_city" | null
  languages: string[]
  aliases: string[]
  status: InstitutionStatus
  logo_url: string | null
  cover_url: string | null
  logo_zoom: number
  logo_fit: "circle" | "contain" | null
  in_use: boolean
  lock_version: number
  updated_at: string
}

export type StaffInstitutionPage = {
  items: StaffInstitution[]
  total: number
  page: number
  page_size: number
  countries: string[]
}

/** The fields a curator writes; on edit an omitted field stays and null clears. */
export type StaffInstitutionInput = Partial<
  Omit<StaffInstitution, "id" | "in_use" | "lock_version" | "updated_at" | "logo_zoom">
> & { logo_zoom?: number | null }

export type StaffInstitutionQuery = {
  q: string
  country: string
  status: "" | InstitutionStatus
  page: number
  pageSize: number
}

/** GET /staff/catalog/institutions: every institution of any status, one page. */
export function useStaffInstitutions(q: StaffInstitutionQuery) {
  return useQuery({
    queryKey: [...KEY, q] as const,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      getApiClient().get<StaffInstitutionPage>(BASE, {
        query: {
          ...(q.q.trim() ? { q: q.q.trim() } : {}),
          ...(q.country ? { country: q.country } : {}),
          ...(q.status ? { status: q.status } : {}),
          page: q.page,
          page_size: q.pageSize,
        },
        signal,
      }),
  })
}

export function useStaffInstitutionMutations() {
  const client = useQueryClient()
  const done = () => client.invalidateQueries({ queryKey: KEY })
  const create = useMutation({
    mutationFn: (body: StaffInstitutionInput) => getApiClient().post<StaffInstitution>(BASE, body),
    onSuccess: done,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; body: StaffInstitutionInput; lock_version: number }) =>
      getApiClient().put<StaffInstitution>(`${BASE}/${encodeURIComponent(v.id)}`, {
        ...v.body,
        lock_version: v.lock_version,
      }),
    onSuccess: done,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/${encodeURIComponent(id)}`),
    onSuccess: done,
  })
  return { create, update, remove }
}
