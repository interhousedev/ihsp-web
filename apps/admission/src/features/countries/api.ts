"use client"

import { getApiClient } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/** Backend `FACT_KEYS`: the facts a country may carry, in display order. */
export const FACT_KEYS = [
  "cost_of_living",
  "climate",
  "opportunities",
  "student_visa",
  "safety",
  "bureaucracy",
  "travel_reach",
  "transport",
  "work_rights",
  "post_study",
  "language",
  "flights_tashkent",
  "community",
  "health",
  "aid",
  "tolerance",
] as const
export type FactKey = (typeof FACT_KEYS)[number]

export type FactValue = string | number | boolean
export type CountryFact = {
  score: number | null
  values: Record<string, FactValue>
  text: { en?: string; ru?: string; uz?: string }
  sources: string[]
}
export type CountryFacts = {
  country: string
  as_of: string
  status: "draft" | "verified"
  verified: boolean
  facts: Partial<Record<FactKey, CountryFact>>
  updated_at: string | null
}
export type CountryFactsList = { items: CountryFacts[]; highlight: string[] }

export const COUNTRY_FACTS_KEY = ["admission", "country-facts"] as const

/** `GET /v1/admission/country-facts`; `fields` are the student's study field names, `highlight` comes back mapped. */
export function useCountryFacts(codes: string[], fields: string[] = []) {
  const sorted = [...codes].toSorted()
  return useQuery({
    queryKey: [...COUNTRY_FACTS_KEY, sorted, fields] as const,
    enabled: sorted.length > 0,
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) =>
      getApiClient().get<CountryFactsList>("/v1/admission/country-facts", {
        query: { codes: sorted.join(","), ...(fields.length ? { fields } : {}) },
        signal,
      }),
  })
}
