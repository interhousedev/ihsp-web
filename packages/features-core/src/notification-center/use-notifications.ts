"use client"

import {
  getNotifications,
  keys,
  postNotificationRead,
  postNotificationsReadAll,
  type NotificationFilter,
  type NotificationItem,
  type Page,
} from "@ihsp/api"
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query"

type NotificationPages = InfiniteData<Page<NotificationItem>, string | undefined>

/** Infinite lists have their own key shape, so they never share a cache entry with a plain page query. */
export function notificationsKey(filter: NotificationFilter, limit: number) {
  return [...keys.notifications.list({ filter, limit }), "infinite"] as const
}

export function useNotifications(filter: NotificationFilter, limit: number) {
  return useInfiniteQuery({
    queryKey: notificationsKey(filter, limit),
    queryFn: ({ pageParam, signal }) => getNotifications({ filter, limit, cursor: pageParam }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })
}

/** Applies `change` to every cached notification of every list (all filters), so a read mark shows everywhere at once. */
function patchCachedNotifications(queryClient: QueryClient, change: (item: NotificationItem) => NotificationItem) {
  queryClient.setQueriesData<NotificationPages>({ queryKey: keys.notifications.all() }, (data) => {
    if (!data || !Array.isArray((data as NotificationPages).pages)) return data
    return {
      ...data,
      pages: data.pages.map((page) => ({ ...page, items: page.items.map(change) })),
    }
  })
}

function adjustUnreadCount(queryClient: QueryClient, delta: number | "zero") {
  queryClient.setQueryData<{ count: number }>(keys.notifications.unreadCount(), (current) =>
    current ? { count: delta === "zero" ? 0 : Math.max(0, current.count + delta) } : current,
  )
}

/** Marks one notification as read (no-op for items that are already read). */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: NotificationItem) => postNotificationRead(item.id),
    onSuccess: (_result, item) => {
      const readAt = new Date().toISOString()
      patchCachedNotifications(queryClient, (current) =>
        current.id === item.id && current.read_at === null ? { ...current, read_at: readAt } : current,
      )
      adjustUnreadCount(queryClient, -1)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => postNotificationsReadAll(),
    onSuccess: () => {
      const readAt = new Date().toISOString()
      patchCachedNotifications(queryClient, (current) =>
        current.read_at === null ? { ...current, read_at: readAt } : current,
      )
      adjustUnreadCount(queryClient, "zero")
    },
  })
}
