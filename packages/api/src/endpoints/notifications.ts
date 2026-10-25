// Notifications (in-app inbox).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type { NotificationItem, NotificationsParams, UnreadCount } from "../types/notifications"

/** GET /v1/notifications?filter=all|activity|announcements&cursor — bearer. */
export function getNotifications(params?: NotificationsParams, opts?: RequestOptions): Promise<Page<NotificationItem>> {
  return api.get<Page<NotificationItem>>("/v1/notifications", { ...opts, query: params })
}
export const getNotificationsQuery = (params?: NotificationsParams) =>
  queryOptions({
    queryKey: keys.notifications.list(params),
    queryFn: ({ signal }) => getNotifications(params, { signal }),
  })

/** GET /v1/notifications/unread-count — bearer. */
export function getNotificationsUnreadCount(opts?: RequestOptions): Promise<UnreadCount> {
  return api.get<UnreadCount>("/v1/notifications/unread-count", opts)
}
export const getNotificationsUnreadCountQuery = () =>
  queryOptions({
    queryKey: keys.notifications.unreadCount(),
    queryFn: ({ signal }) => getNotificationsUnreadCount({ signal }),
  })

/** POST /v1/notifications/{id}/read — bearer; `204`. */
export function postNotificationRead(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/notifications/${seg(id)}/read`, undefined, opts)
}

/** POST /v1/notifications/read-all — bearer; `204`. */
export function postNotificationsReadAll(opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/notifications/read-all", undefined, opts)
}

// --- Names used by the app plans ---

export const listNotifications = getNotifications
