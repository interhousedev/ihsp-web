// Broadcasts (role: admin).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  AudienceCount,
  AudienceCountBody,
  BroadcastInput,
  BroadcastItem,
  BroadcastPatchBody,
  BroadcastSendBody,
  BroadcastsParams,
} from "../types/broadcasts"

/** GET /v1/admin/broadcasts?status&cursor — admin. */
export function getAdminBroadcasts(params?: BroadcastsParams, opts?: RequestOptions): Promise<Page<BroadcastItem>> {
  return api.get<Page<BroadcastItem>>("/v1/admin/broadcasts", { ...opts, query: params })
}
export const getAdminBroadcastsQuery = (params?: BroadcastsParams) =>
  queryOptions({
    queryKey: keys.admin.broadcasts.list(params),
    queryFn: ({ signal }) => getAdminBroadcasts(params, { signal }),
  })

/** POST /v1/admin/broadcasts — admin; creates a draft. */
export function postAdminBroadcasts(body: BroadcastInput, opts?: RequestOptions): Promise<BroadcastItem> {
  return api.post<BroadcastItem>("/v1/admin/broadcasts", body, opts)
}

/** GET /v1/admin/broadcasts/{id} — admin. */
export function getAdminBroadcast(id: string, opts?: RequestOptions): Promise<BroadcastItem> {
  return api.get<BroadcastItem>(`/v1/admin/broadcasts/${seg(id)}`, opts)
}
export const getAdminBroadcastQuery = (id: string) =>
  queryOptions({
    queryKey: keys.admin.broadcasts.detail(id),
    queryFn: ({ signal }) => getAdminBroadcast(id, { signal }),
  })

/** PATCH /v1/admin/broadcasts/{id} — admin; drafts and scheduled broadcasts only. */
export function patchAdminBroadcast(
  id: string,
  body: BroadcastPatchBody,
  opts?: RequestOptions,
): Promise<BroadcastItem> {
  return api.patch<BroadcastItem>(`/v1/admin/broadcasts/${seg(id)}`, body, opts)
}

/** POST /v1/admin/broadcasts/audience-count — admin. */
export function postAdminBroadcastsAudienceCount(
  body: AudienceCountBody,
  opts?: RequestOptions,
): Promise<AudienceCount> {
  return api.post<AudienceCount>("/v1/admin/broadcasts/audience-count", body, opts)
}

/** POST /v1/admin/broadcasts/{id}/preview — admin; `204`, sent to the caller's Telegram. */
export function postAdminBroadcastPreview(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/admin/broadcasts/${seg(id)}/preview`, undefined, opts)
}

/** POST /v1/admin/broadcasts/{id}/send — admin; sends now, or schedules with `scheduled_at`. */
export function postAdminBroadcastSend(
  id: string,
  body?: BroadcastSendBody,
  opts?: RequestOptions,
): Promise<BroadcastItem> {
  return api.post<BroadcastItem>(`/v1/admin/broadcasts/${seg(id)}/send`, body ?? {}, opts)
}

/** POST /v1/admin/broadcasts/{id}/cancel — admin. */
export function postAdminBroadcastCancel(id: string, opts?: RequestOptions): Promise<BroadcastItem> {
  return api.post<BroadcastItem>(`/v1/admin/broadcasts/${seg(id)}/cancel`, undefined, opts)
}
