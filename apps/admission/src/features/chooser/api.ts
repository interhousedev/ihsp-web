import { getApiClient, type AdmissionListBrief } from "@ihsp/api"
import type { Filters } from "./filters"
import { EMPTY_FILTERS, filtersToQuery } from "./filters"
import type {
  Affordability,
  Estimate,
  Facet,
  Institution,
  InstitutionPage,
  ListAddBody,
  ListEntry,
  ListPatchBody,
  Scholarship,
  StudyGroup,
  Summary,
  UniSuggestions,
} from "./types"

const BASE = "/v1/admission"

export function searchInstitutions(
  filters: Filters,
  cursor: number,
  limit: number,
  locale: string,
  signal?: AbortSignal,
) {
  return getApiClient().get<InstitutionPage>(`${BASE}/catalog/institutions`, {
    query: { ...filtersToQuery(filters), cursor, limit },
    headers: { "Accept-Language": locale },
    signal,
  })
}

/** Text search for the college picker: the first `limit` matches of `q` (an empty `q` returns the catalog's default order). */
export function searchInstitutionsByText(q: string, limit: number, locale: string, signal?: AbortSignal) {
  return searchInstitutions({ ...EMPTY_FILTERS, q, sort: "relevance" }, 0, limit, locale, signal)
}

export function getFacets(locale: string, signal?: AbortSignal) {
  return getApiClient().get<Facet[]>(`${BASE}/catalog/facets`, { headers: { "Accept-Language": locale }, signal })
}

export function getStudyFields(locale: string, signal?: AbortSignal) {
  return getApiClient().get<StudyGroup[]>(`${BASE}/catalog/study-fields`, {
    headers: { "Accept-Language": locale },
    signal,
  })
}

export function getInstitution(id: string, locale: string, signal?: AbortSignal) {
  return getApiClient().get<Institution>(`${BASE}/catalog/institutions/${encodeURIComponent(id)}`, {
    headers: { "Accept-Language": locale },
    signal,
  })
}

export function postSummary(id: string, language: string) {
  return getApiClient().post<Summary>(`${BASE}/catalog/institutions/${encodeURIComponent(id)}/summary`, undefined, {
    query: { language },
  })
}

export type ScholarshipFilters = { institution_id?: string; country?: string; basis?: string; coverage_min?: number }

export function getScholarships(filters: ScholarshipFilters, locale: string, signal?: AbortSignal) {
  return getApiClient().get<Scholarship[]>(`${BASE}/catalog/scholarships`, {
    query: { ...filters },
    headers: { "Accept-Language": locale },
    signal,
  })
}

export function getList(signal?: AbortSignal) {
  return getApiClient().get<ListEntry[]>(`${BASE}/list`, { signal })
}

export function addToList(body: ListAddBody) {
  return getApiClient().post<ListEntry>(`${BASE}/list`, body)
}

export function patchListEntry(id: string, body: ListPatchBody) {
  return getApiClient().patch<ListEntry>(`${BASE}/list/${encodeURIComponent(id)}`, body)
}

export function removeListEntry(id: string) {
  return getApiClient().delete<void>(`${BASE}/list/${encodeURIComponent(id)}`)
}

export function checkAffordability(id: string) {
  return getApiClient().post<Affordability>(`${BASE}/list/${encodeURIComponent(id)}/affordability`)
}

export function requestSignOff(id: string) {
  return getApiClient().post<Affordability>(`${BASE}/list/${encodeURIComponent(id)}/affordability/request-sign-off`)
}

export function getEstimate(id: string, signal?: AbortSignal) {
  return getApiClient().get<Estimate>(`${BASE}/list/${encodeURIComponent(id)}/estimate`, { signal })
}

export function getUniSuggestions(id: string, locale: string, signal?: AbortSignal) {
  return getApiClient().get<UniSuggestions>(`${BASE}/uni-chats/${encodeURIComponent(id)}/suggestions`, {
    headers: { "Accept-Language": locale },
    signal,
  })
}

/** The AI brief on the balance of my list (`POST /list/brief`; needs the `admission_ai` consent). */
export function postListBrief(locale: string) {
  return getApiClient().post<AdmissionListBrief>(`${BASE}/list/brief`, undefined, {
    headers: { "Accept-Language": locale },
  })
}
