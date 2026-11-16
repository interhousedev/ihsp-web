import { getApiClient, type AdmissionChances, type AdmissionMatchDecision, type AdmissionMatchList } from "@ihsp/api"

const BASE = "/v1/admission"

export function getMatches(limit: number, signal?: AbortSignal) {
  return getApiClient().get<AdmissionMatchList>(`${BASE}/matches`, { query: { limit }, signal })
}

export function postDecision(id: string, decision: AdmissionMatchDecision) {
  return getApiClient().post<void>(`${BASE}/matches/${encodeURIComponent(id)}/decision`, { decision })
}

export function deleteDecision(id: string) {
  return getApiClient().delete<void>(`${BASE}/matches/${encodeURIComponent(id)}/decision`)
}

export function getChances(id: string, signal?: AbortSignal) {
  return getApiClient().get<AdmissionChances>(`${BASE}/universities/${encodeURIComponent(id)}/chances`, { signal })
}
