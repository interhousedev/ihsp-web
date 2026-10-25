// Identity — EMIS registration, reclaim and the internal EMIS gateway.

import { api } from "../client"
import { seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type {
  EmisProfile,
  EmisRatingsParams,
  EmisSubject,
  EmisSubjectRatings,
  ReclaimCompleteBody,
  ReclaimEmailBody,
  ReclaimEmisBody,
  ReclaimStart,
  RegisterCompleteBody,
  RegisterCompleteResponse,
  RegisterEmailBody,
  RegisterEmisBody,
  RegistrationStart,
} from "../types/registration"

/** POST /v1/id/register/emis — none. */
export function postIdRegisterEmis(body: RegisterEmisBody, opts?: RequestOptions): Promise<RegistrationStart> {
  return api.post<RegistrationStart>("/v1/id/register/emis", body, { ...opts, auth: "none" })
}

/** POST /v1/id/register/email — none; `202`. */
export function postIdRegisterEmail(body: RegisterEmailBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/register/email", body, { ...opts, auth: "none" })
}

/** POST /v1/id/register/complete — none. */
export function postIdRegisterComplete(
  body: RegisterCompleteBody,
  opts?: RequestOptions,
): Promise<RegisterCompleteResponse> {
  return api.post<RegisterCompleteResponse>("/v1/id/register/complete", body, { ...opts, auth: "none" })
}

/** POST /v1/id/reclaim/emis — none. */
export function postIdReclaimEmis(body: ReclaimEmisBody, opts?: RequestOptions): Promise<ReclaimStart> {
  return api.post<ReclaimStart>("/v1/id/reclaim/emis", body, { ...opts, auth: "none" })
}

/** POST /v1/id/reclaim/email — none; `202`. */
export function postIdReclaimEmail(body: ReclaimEmailBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/reclaim/email", body, { ...opts, auth: "none" })
}

/** POST /v1/id/reclaim/complete — none; `204`. */
export function postIdReclaimComplete(body: ReclaimCompleteBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/reclaim/complete", body, { ...opts, auth: "none" })
}

// --- Internal (service token); the web never calls these, they exist for completeness and the contract check ---

function serviceHeaders(serviceToken: string): Record<string, string> {
  return { Authorization: `Bearer ${serviceToken}` }
}

/** GET /internal/emis/{user_id}/profile — service. */
export function getInternalEmisProfile(
  userId: string,
  serviceToken: string,
  opts?: RequestOptions,
): Promise<EmisProfile> {
  return api.get<EmisProfile>(`/internal/emis/${seg(userId)}/profile`, {
    ...opts,
    auth: "none",
    headers: serviceHeaders(serviceToken),
  })
}

/** GET /internal/emis/{user_id}/subjects — service. */
export function getInternalEmisSubjects(
  userId: string,
  serviceToken: string,
  opts?: RequestOptions,
): Promise<EmisSubject[]> {
  return api.get<EmisSubject[]>(`/internal/emis/${seg(userId)}/subjects`, {
    ...opts,
    auth: "none",
    headers: serviceHeaders(serviceToken),
  })
}

/** GET /internal/emis/{user_id}/ratings?subject=&semester= — service. */
export function getInternalEmisRatings(
  userId: string,
  params: EmisRatingsParams,
  serviceToken: string,
  opts?: RequestOptions,
): Promise<EmisSubjectRatings> {
  return api.get<EmisSubjectRatings>(`/internal/emis/${seg(userId)}/ratings`, {
    ...opts,
    auth: "none",
    query: params,
    headers: serviceHeaders(serviceToken),
  })
}

// --- Names used by the app plans ---

export const postRegisterEmis = postIdRegisterEmis
export const postRegisterEmail = postIdRegisterEmail
export const postRegisterComplete = postIdRegisterComplete
export const postReclaimEmis = postIdReclaimEmis
export const postReclaimEmail = postIdReclaimEmail
export const postReclaimComplete = postIdReclaimComplete
