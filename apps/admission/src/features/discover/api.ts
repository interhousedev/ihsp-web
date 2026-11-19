import type { UniSuggestions } from "../chooser/types"
import {
  getApiClient,
  type AdmissionChances,
  type AdmissionDefaultPrompt,
  type AdmissionMatchDecision,
  type AdmissionMatchList,
  type AdmissionUniChat,
} from "@ihsp/api"

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

export function openUniChat(institutionId: string, locale: string) {
  return getApiClient().post<AdmissionUniChat>(`${BASE}/uni-chats/${encodeURIComponent(institutionId)}`, undefined, {
    headers: { "Accept-Language": locale },
  })
}

/** The suggestion chips come in `locale` (the backend reads Accept-Language). */
export function getUniChatSuggestions(institutionId: string, locale: string, signal?: AbortSignal) {
  return getApiClient().get<UniSuggestions>(`${BASE}/uni-chats/${encodeURIComponent(institutionId)}/suggestions`, {
    headers: { "Accept-Language": locale },
    signal,
  })
}

export function getDefaultPrompt(signal?: AbortSignal) {
  return getApiClient().get<AdmissionDefaultPrompt>(`${BASE}/uni-chat/default-prompt`, { signal })
}

export function putDefaultPrompt(prompt: string) {
  return getApiClient().put<AdmissionDefaultPrompt>(`${BASE}/uni-chat/default-prompt`, { prompt })
}

/** Opens the SSE variant of the default-prompt run; a 204 answer (already auto-run) has no stream. */
export function streamRunDefault(institutionId: string, auto: boolean, locale: string, signal?: AbortSignal) {
  return getApiClient().request<Response>({
    method: "POST",
    path: `${BASE}/uni-chats/${encodeURIComponent(institutionId)}/run-default`,
    query: { auto },
    // The built-in research prompt is written in the app's language, not the browser's.
    headers: { Accept: "text/event-stream", "Accept-Language": locale },
    responseType: "stream",
    signal,
  })
}
