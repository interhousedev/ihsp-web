// Admin — "Call for improvements" (`/v1/admin/feedback`).

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { Page } from "../types/common"
import type {
  AdminFeedbackDetail,
  AdminFeedbackListItem,
  AdminFeedbackListParams,
  AdminFeedbackResponse,
  AdminFeedbackResponseInput,
  AdminFeedbackStatusPatch,
} from "../types/admin-feedback"

export const adminFeedbackKeys = {
  all: () => ["admin", "feedback"] as const,
  list: (params?: AdminFeedbackListParams) => ["admin", "feedback", "list", params ?? {}] as const,
  detail: (id: string) => ["admin", "feedback", "detail", id] as const,
}

/** GET /v1/admin/feedback — admin; filters by `status`, `kind`, `area`; `cursor` and `limit` page through the list. */
export function getAdminFeedback(
  params?: AdminFeedbackListParams,
  opts?: RequestOptions,
): Promise<Page<AdminFeedbackListItem>> {
  return api.get<Page<AdminFeedbackListItem>>("/v1/admin/feedback", { ...opts, query: params })
}

/** Cursor-paged list query; the key carries every filter. */
export const getAdminFeedbackQuery = (params?: AdminFeedbackListParams) =>
  queryOptions({
    queryKey: adminFeedbackKeys.list(params),
    queryFn: ({ signal }) => getAdminFeedback(params, { signal }),
  })

/** GET /v1/admin/feedback/{id} — admin; every field, the reporter, `page_url` and the response thread. */
export function getAdminFeedbackItem(id: string, opts?: RequestOptions): Promise<AdminFeedbackDetail> {
  return api.get<AdminFeedbackDetail>(`/v1/admin/feedback/${seg(id)}`, opts)
}

export const getAdminFeedbackItemQuery = (id: string) =>
  queryOptions({
    queryKey: adminFeedbackKeys.detail(id),
    queryFn: ({ signal }) => getAdminFeedbackItem(id, { signal }),
  })

/** PATCH /v1/admin/feedback/{id} — admin; sets the status and returns the detail. */
export function patchAdminFeedback(
  id: string,
  body: AdminFeedbackStatusPatch,
  opts?: RequestOptions,
): Promise<AdminFeedbackDetail> {
  return api.patch<AdminFeedbackDetail>(`/v1/admin/feedback/${seg(id)}`, body, opts)
}

/** POST /v1/admin/feedback/{id}/responses — admin; the reply goes out on every channel chosen (201). */
export function postAdminFeedbackResponse(
  id: string,
  body: AdminFeedbackResponseInput,
  opts?: RequestOptions,
): Promise<AdminFeedbackResponse> {
  return api.post<AdminFeedbackResponse>(`/v1/admin/feedback/${seg(id)}/responses`, body, opts)
}
