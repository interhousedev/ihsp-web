"use client"

import type { NotificationItem as NotificationData } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"

/** Internal paths (`/grades/`) are client-side links; anything else (another IHSP app) is a normal link. */
function isInternal(link: string): boolean {
  return link.startsWith("/") && !link.startsWith("//")
}

export type NotificationItemProps = {
  item: NotificationData
  compact?: boolean
  /** Called when the row is opened (marks the notification as read). */
  onOpen: (item: NotificationData) => void
}

/** One notification row: unread dot, title, text, time. The whole row is a link when the notification has one. */
export function NotificationItem({ item, compact = false, onOpen }: NotificationItemProps) {
  const t = useT("notifications")
  const f = useFormatters()
  const unread = item.read_at === null

  const content: ReactNode = (
    <>
      <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", unread ? "bg-primary" : "bg-transparent")} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{item.title}</span>
          <time dateTime={item.created_at} className="text-muted-foreground shrink-0 text-xs">
            {f.relative(item.created_at)}
          </time>
        </span>
        <span className={cn("text-muted-foreground block text-sm", compact ? "line-clamp-2" : "break-words")}>
          {item.body}
        </span>
        {unread ? <span className="sr-only">{t("unread")}</span> : null}
      </span>
    </>
  )

  const rowClass = cn(
    "hover:bg-accent focus-visible:ring-ring flex min-h-14 w-full items-start gap-3 rounded-lg px-3 py-2 text-start outline-none focus-visible:ring-2",
    unread && "bg-accent/40",
  )

  return (
    <li data-unread={unread} data-testid="notification-item">
      {item.link && isInternal(item.link) ? (
        <Link href={item.link} onClick={() => onOpen(item)} className={rowClass}>
          {content}
        </Link>
      ) : item.link ? (
        <a href={item.link} onClick={() => onOpen(item)} className={rowClass}>
          {content}
        </a>
      ) : (
        <button type="button" onClick={() => onOpen(item)} className={rowClass}>
          {content}
        </button>
      )}
    </li>
  )
}
