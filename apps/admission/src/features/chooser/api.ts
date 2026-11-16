import { getApiClient } from "@ihsp/api"
import type { Filters } from "./filters"
import { filtersToQuery } from "./filters"
import type {
  Affordability,
  Estimate,
  Institution,
  InstitutionPage,
  ListAddBody,
  ListEntry,
  ListPatchBody,
  Scholarship,
  Summary,
} from "./types"

const BASE = "/v1/admission"

export function searchInstitutions(filters: Filters, cursor: number, limit: number, signal?: AbortSignal) {
  return getApiClient().get<InstitutionPage>(`${BASE}/catalog/institutions`, {
    query: { ...filtersToQuery(filters), cursor, limit },
    signal,
  })
}

export function getInstitution(id: string, signal?: AbortSignal) {
  return getApiClient().get<Institution>(`${BASE}/catalog/institutions/${encodeURIComponent(id)}`, { signal })
}

export function postSummary(id: string, language: string) {
  return getApiClient().post<Summary>(`${BASE}/catalog/institutions/${encodeURIComponent(id)}/summary`, undefined, {
    query: { language },
  })
}

export type ScholarshipFilters = { institution_id?: string; country?: string; basis?: string; coverage_min?: number }

export function getScholarships(filters: ScholarshipFilters, signal?: AbortSignal) {
  return getApiClient().get<Scholarship[]>(`${BASE}/catalog/scholarships`, { query: { ...filters }, signal })
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
