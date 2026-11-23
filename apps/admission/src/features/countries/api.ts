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

export const REGIONS = ["central_asia", "europe", "middle_east", "asia", "africa", "americas", "oceania"] as const
export type Region = (typeof REGIONS)[number]

// mirrors openapi admission_countries_list
export type CountryOverview = {
  country: string
  region: string
  status: "missing" | "draft" | "verified"
  coverage: number
  as_of: string | null
  scores: Record<string, number>
  institution_count: number
  median_salary_usd: number | null
}
export type CountryOverviewList = { items: CountryOverview[] }

export type Employer = { name: string; sector?: string | null; url?: string | null }
/** `employers.values` and `salaries.values`: the two facts with nested values. */
export type EmployersValues = { fields?: Record<string, Employer[]> }
export type SalariesValues = {
  currency?: "USD"
  year?: number
  overall_median_annual?: number | null
  by_field?: Record<string, number>
}
export type NestedFact<V> = Omit<CountryFact, "values"> & { values: V }

// mirrors openapi admission_countries_read
export type CountryRanking = { system: string; subject: string; rank: number | string; year: number | null }
export type CountryInstitution = {
  id: string
  name: string
  city: string | null
  logo_url: string | null
  verified: boolean
  rankings: CountryRanking[]
}
export type CountryProfile = {
  country: string
  region: string
  facts:
    | (Omit<CountryFacts, "facts"> & {
        facts: CountryFacts["facts"] & {
          employers?: NestedFact<EmployersValues>
          salaries?: NestedFact<SalariesValues>
        }
      })
    | null
  highlight: string[]
  institutions: CountryInstitution[]
  institution_count: number
}

/** `GET /v1/admission/countries`: countries with facts or catalog universities. */
export function useCountries() {
  return useQuery({
    queryKey: ["admission", "countries"] as const,
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) => getApiClient().get<CountryOverviewList>("/v1/admission/countries", { signal }),
  })
}

/** `GET /v1/admission/countries/{code}`; `fields` are the student's study field names. */
export function useCountryProfile(code: string, fields: string[] = []) {
  return useQuery({
    queryKey: ["admission", "countries", code, fields] as const,
    enabled: /^[A-Z]{2}$/.test(code),
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) =>
      getApiClient().get<CountryProfile>(`/v1/admission/countries/${encodeURIComponent(code)}`, {
        query: fields.length ? { fields } : {},
        signal,
      }),
  })
}

/** Flag emoji of an ISO alpha-2 code (regional indicator symbols). */
export function flagOf(code: string): string {
  return /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : ""
}
