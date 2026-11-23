"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { COUNTRY_FACTS_KEY, type CountryFact, type CountryFacts, type FactKey } from "../countries/api"

const STAFF = "/v1/admission/staff/countries"
export const COUNTRY_STATUSES = ["missing", "draft", "verified"] as const
export type CountryStatus = (typeof COUNTRY_STATUSES)[number]
export type CountrySummary = {
  country: string
  status: CountryStatus
  coverage: number
  as_of: string | null
}
export type CountryPut = {
  as_of: string
  verified: boolean
  facts: Partial<Record<FactKey, CountryFact>>
}

const KEY = ["admission", "staff-countries"] as const

export function useStaffCountries(q: string, status: CountryStatus | null) {
  return useQuery({
    queryKey: [...KEY, q, status] as const,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: CountrySummary[] }>(STAFF, {
        query: { ...(q ? { q } : {}), ...(status ? { status } : {}) },
        signal,
      }),
  })
}

/** The stored facts of one country, or `null` while it has none (404). */
export function useStoredCountry(code: string) {
  return useQuery({
    queryKey: [...COUNTRY_FACTS_KEY, "one", code] as const,
    queryFn: async ({ signal }): Promise<CountryFacts | null> => {
      try {
        return await getApiClient().get<CountryFacts>(`/v1/admission/country-facts/${code}`, { signal })
      } catch (error) {
        if ((error as { status?: number }).status === 404) return null
        throw error
      }
    },
  })
}

function useRefresh() {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: KEY }),
      client.invalidateQueries({ queryKey: COUNTRY_FACTS_KEY }),
    ])
}

export function usePutCountry(code: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (body: CountryPut) => getApiClient().put<CountryFacts>(`${STAFF}/${code}`, body),
    onSuccess: refresh,
  })
}

export function useVerifyCountry() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (code: string) => getApiClient().post<CountryFacts>(`${STAFF}/${code}/verify`, {}),
    onSuccess: refresh,
  })
}
