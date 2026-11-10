// Academic — excuses: the student's requests (`/v1/me`), the curators' queue (`/v1/staff`) and the admin view.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  Excuse,
  ExcuseDecisionBody,
  ExcuseEndBody,
  ExcuseExclusionBody,
  ExcuseList,
  ExcuseMessageBody,
  ExcuseRequestBody,
  ExcuseTemplateList,
  MyExcusesParams,
  StaffExcusesParams,
} from "../types/excuses"

/** GET /v1/me/excuse-templates — the ready reasons of the request form. */
export function getMeExcuseTemplates(opts?: RequestOptions): Promise<ExcuseTemplateList> {
  return api.get<ExcuseTemplateList>("/v1/me/excuse-templates", opts)
}
export const getMeExcuseTemplatesQuery = () =>
  queryOptions({ queryKey: keys.me.excuseTemplates(), queryFn: ({ signal }) => getMeExcuseTemplates({ signal }) })

/** GET /v1/me/excuses?status&cursor — the caller's excuses, newest first. */
export function getMeExcuses(params?: MyExcusesParams, opts?: RequestOptions): Promise<ExcuseList> {
  return api.get<ExcuseList>("/v1/me/excuses", { ...opts, query: params })
}
export const getMeExcusesQuery = (params?: MyExcusesParams) =>
  queryOptions({ queryKey: keys.me.excuses(params), queryFn: ({ signal }) => getMeExcuses(params, { signal }) })

/** POST /v1/me/excuses — the request starts pending; `422 academic.excuse_document_required` without a document. */
export function postMeExcuse(body: ExcuseRequestBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>("/v1/me/excuses", body, opts)
}

/** GET /v1/me/excuses/{id} — with the thread; a stranger's excuse answers 404. */
export function getMeExcuse(id: string, opts?: RequestOptions): Promise<Excuse> {
  return api.get<Excuse>(`/v1/me/excuses/${seg(id)}`, opts)
}
export const getMeExcuseQuery = (id: string) =>
  queryOptions({ queryKey: keys.me.excuse(id), queryFn: ({ signal }) => getMeExcuse(id, { signal }) })

/** POST /v1/me/excuses/{id}/cancel — a pending request or an own approved one. */
export function postMeExcuseCancel(id: string, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/me/excuses/${seg(id)}/cancel`, undefined, opts)
}

/** POST /v1/me/excuses/{id}/messages — text and/or files; answers the excuse with the thread. */
export function postMeExcuseMessage(id: string, body: ExcuseMessageBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/me/excuses/${seg(id)}/messages`, body, opts)
}

/** GET /v1/staff/excuses?status&student_id&cursor — curator or administrator. */
export function getStaffExcuses(params?: StaffExcusesParams, opts?: RequestOptions): Promise<ExcuseList> {
  return api.get<ExcuseList>("/v1/staff/excuses", { ...opts, query: params })
}
export const getStaffExcusesQuery = (params?: StaffExcusesParams) =>
  queryOptions({ queryKey: keys.staff.excuses(params), queryFn: ({ signal }) => getStaffExcuses(params, { signal }) })

/** POST /v1/staff/excuses — an exclusion: the curator excuses a student without a request (it starts approved). */
export function postStaffExcuse(body: ExcuseExclusionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>("/v1/staff/excuses", body, opts)
}

/** GET /v1/staff/excuses/{id} — with the thread. */
export function getStaffExcuse(id: string, opts?: RequestOptions): Promise<Excuse> {
  return api.get<Excuse>(`/v1/staff/excuses/${seg(id)}`, opts)
}
export const getStaffExcuseQuery = (id: string) =>
  queryOptions({ queryKey: keys.staff.excuse(id), queryFn: ({ signal }) => getStaffExcuse(id, { signal }) })

/** PATCH /v1/staff/excuses/{id} — sets `ends_on` of an open-ended excuse. */
export function patchStaffExcuse(id: string, body: ExcuseEndBody, opts?: RequestOptions): Promise<Excuse> {
  return api.patch<Excuse>(`/v1/staff/excuses/${seg(id)}`, body, opts)
}

/** POST /v1/staff/excuses/{id}/approve */
export function postStaffExcuseApprove(id: string, body: ExcuseDecisionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/staff/excuses/${seg(id)}/approve`, body, opts)
}

/** POST /v1/staff/excuses/{id}/reject */
export function postStaffExcuseReject(id: string, body: ExcuseDecisionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/staff/excuses/${seg(id)}/reject`, body, opts)
}

/** POST /v1/staff/excuses/{id}/revoke — takes back an approved excuse. */
export function postStaffExcuseRevoke(id: string, body: ExcuseDecisionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/staff/excuses/${seg(id)}/revoke`, body, opts)
}

/** POST /v1/staff/excuses/{id}/messages */
export function postStaffExcuseMessage(id: string, body: ExcuseMessageBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/staff/excuses/${seg(id)}/messages`, body, opts)
}

/** GET /v1/admin/excuses?status&student_id&cursor — every excuse, newest first. */
export function getAdminExcuses(params?: StaffExcusesParams, opts?: RequestOptions): Promise<ExcuseList> {
  return api.get<ExcuseList>("/v1/admin/excuses", { ...opts, query: params })
}
export const getAdminExcusesQuery = (params?: StaffExcusesParams) =>
  queryOptions({ queryKey: keys.admin.excuses(params), queryFn: ({ signal }) => getAdminExcuses(params, { signal }) })

/** GET /v1/admin/excuses/{id} — with the thread. */
export function getAdminExcuse(id: string, opts?: RequestOptions): Promise<Excuse> {
  return api.get<Excuse>(`/v1/admin/excuses/${seg(id)}`, opts)
}
export const getAdminExcuseQuery = (id: string) =>
  queryOptions({ queryKey: keys.admin.excuse(id), queryFn: ({ signal }) => getAdminExcuse(id, { signal }) })

/** POST /v1/admin/excuses/{id}/approve */
export function postAdminExcuseApprove(id: string, body: ExcuseDecisionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/admin/excuses/${seg(id)}/approve`, body, opts)
}

/** POST /v1/admin/excuses/{id}/reject */
export function postAdminExcuseReject(id: string, body: ExcuseDecisionBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/admin/excuses/${seg(id)}/reject`, body, opts)
}

/** POST /v1/admin/excuses/{id}/messages */
export function postAdminExcuseMessage(id: string, body: ExcuseMessageBody, opts?: RequestOptions): Promise<Excuse> {
  return api.post<Excuse>(`/v1/admin/excuses/${seg(id)}/messages`, body, opts)
}
