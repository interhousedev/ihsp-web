"use client"

import type { NotificationFilter, NotificationItem as NotificationData } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import { NotificationItem } from "./notification-item"
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "./use-notifications"

const FILTERS: readonly NotificationFilter[] = ["all", "activity", "announcements"]
const FULL_LIMIT = 20
const COMPACT_LIMIT = 6

function isFilter(value: unknown): value is NotificationFilter {
  return FILTERS.includes(value as NotificationFilter)
}

/**
 * The notification inbox (WEB-27, UF-WEB-15): filters Activity / Announcements, unread state, mark one or all as read.
 * `compact` is the short list inside the bell popover (latest items, no filters, no paging).
 */
export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const t = useT("notifications")
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const query = useNotifications(compact ? "all" : filter, compact ? COMPACT_LIMIT : FULL_LIMIT)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const items: NotificationData[] = query.data?.pages.flatMap((page) => page.items) ?? []
  const hasUnread = items.some((item) => item.read_at === null)

  function open(item: NotificationData) {
    if (item.read_at === null) markRead.mutate(item)
  }

  return (
    <section aria-label={t("title")} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {compact ? (
          <h2 className="text-sm font-semibold">{t("title")}</h2>
        ) : (
          <Tabs value={filter} onValueChange={(value) => isFilter(value) && setFilter(value)}>
            <TabsList className="h-auto min-h-11 md:h-8 md:min-h-0">
              {FILTERS.map((value) => (
                <TabsTrigger key={value} value={value} className="min-h-11 px-3 md:min-h-0">
                  {t(`filters.${value}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={compact ? undefined : "min-h-11 md:min-h-8"}
          disabled={!hasUnread || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          {t("markAllRead")}
        </Button>
      </div>

      {query.isPending ? <StateView state="loading" rows={compact ? 3 : 5} /> : null}
      {query.isError ? <StateView state="error" error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && items.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <NotificationItem key={item.id} item={item} compact={compact} onOpen={open} />
          ))}
        </ul>
      ) : null}

      {!compact && query.hasNextPage ? (
        <Button
          variant="outline"
          className="min-h-11 self-center md:min-h-8"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t("loadMore")}
        </Button>
      ) : null}
    </section>
  )
}
