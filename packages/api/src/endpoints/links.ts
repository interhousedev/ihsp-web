// Links, shares, lesson resources and moderation.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  LinkCreateBody,
  LinkDisableBody,
  LinkItem,
  ModerationItem,
  ModerationQueueParams,
  ModerationSearchParams,
  MyLinksParams,
  ResourceCreateBody,
  ResourceHideBody,
  ResourceItem,
  ShareCreateBody,
} from "../types/links"

/** POST /v1/links — bearer; short link to a URL or to one of the user's files. */
export function postLinks(body: LinkCreateBody, opts?: RequestOptions): Promise<LinkItem> {
  return api.post<LinkItem>("/v1/links", body, opts)
}

/** GET /v1/me/links?kind&target_id&cursor — bearer. */
export function getMeLinks(params?: MyLinksParams, opts?: RequestOptions): Promise<Page<LinkItem>> {
  return api.get<Page<LinkItem>>("/v1/me/links", { ...opts, query: params })
}
export const getMeLinksQuery = (params?: MyLinksParams) =>
  queryOptions({
    queryKey: keys.me.links(params),
    queryFn: ({ signal }) => getMeLinks(params, { signal }),
  })

/** DELETE /v1/links/{id} — owner; `204`. */
export function deleteLink(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/links/${seg(id)}`, opts)
}

/** POST /v1/shares — bearer; public share of a chat or a flash card set. */
export function postShares(body: ShareCreateBody, opts?: RequestOptions): Promise<LinkItem> {
  return api.post<LinkItem>("/v1/shares", body, opts)
}

/** POST /v1/links/{id}/revoke — owner. */
export function postLinkRevoke(id: string, opts?: RequestOptions): Promise<LinkItem> {
  return api.post<LinkItem>(`/v1/links/${seg(id)}/revoke`, undefined, opts)
}

/** GET /v1/lessons/{lesson_id}/resources — audience, lesson teacher, admin. */
export function getLessonResources(lessonId: string, opts?: RequestOptions): Promise<ResourceItem[]> {
  return api.get<ResourceItem[]>(`/v1/lessons/${seg(lessonId)}/resources`, opts)
}
export const getLessonResourcesQuery = (lessonId: string) =>
  queryOptions({
    queryKey: keys.lessons.resources(lessonId),
    queryFn: ({ signal }) => getLessonResources(lessonId, { signal }),
  })

/** POST /v1/lessons/{lesson_id}/resources — student in the audience (inside the window), lesson teacher, admin. */
export function postLessonResources(
  lessonId: string,
  body: ResourceCreateBody,
  opts?: RequestOptions,
): Promise<ResourceItem[]> {
  return api.post<ResourceItem[]>(`/v1/lessons/${seg(lessonId)}/resources`, body, opts)
}

/** DELETE /v1/lessons/{lesson_id}/resources/{link_id} — author, admin; `204`. */
export function deleteLessonResource(lessonId: string, linkId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/lessons/${seg(lessonId)}/resources/${seg(linkId)}`, opts)
}

/** POST /v1/lessons/{lesson_id}/resources/{link_id}/hide — lesson teacher, admin. */
export function postLessonResourceHide(
  lessonId: string,
  linkId: string,
  body: ResourceHideBody,
  opts?: RequestOptions,
): Promise<ResourceItem> {
  return api.post<ResourceItem>(`/v1/lessons/${seg(lessonId)}/resources/${seg(linkId)}/hide`, body, opts)
}

/** GET /v1/admin/moderation/queue?cursor — admin. */
export function getAdminModerationQueue(
  params?: ModerationQueueParams,
  opts?: RequestOptions,
): Promise<Page<ModerationItem>> {
  return api.get<Page<ModerationItem>>("/v1/admin/moderation/queue", { ...opts, query: params })
}
export const getAdminModerationQueueQuery = (params?: ModerationQueueParams) =>
  queryOptions({
    queryKey: keys.admin.moderation.queue(params),
    queryFn: ({ signal }) => getAdminModerationQueue(params, { signal }),
  })

/** GET /v1/admin/moderation/search?q — admin (slug, share URL or login). */
export function getAdminModerationSearch(
  params: ModerationSearchParams,
  opts?: RequestOptions,
): Promise<ModerationItem[]> {
  return api.get<ModerationItem[]>("/v1/admin/moderation/search", { ...opts, query: params })
}
export const getAdminModerationSearchQuery = (params: ModerationSearchParams) =>
  queryOptions({
    queryKey: keys.admin.moderation.search(params.q),
    queryFn: ({ signal }) => getAdminModerationSearch(params, { signal }),
  })

/** POST /v1/admin/links/{id}/disable — admin. */
export function postAdminLinkDisable(
  id: string,
  body: LinkDisableBody,
  opts?: RequestOptions,
): Promise<ModerationItem> {
  return api.post<ModerationItem>(`/v1/admin/links/${seg(id)}/disable`, body, opts)
}

/** POST /v1/admin/links/{id}/dismiss-reports — admin. */
export function postAdminLinkDismissReports(id: string, opts?: RequestOptions): Promise<ModerationItem> {
  return api.post<ModerationItem>(`/v1/admin/links/${seg(id)}/dismiss-reports`, undefined, opts)
}

// --- Names used by the app plans ---

export const listMyLinks = getMeLinks
export const postShare = postShares
