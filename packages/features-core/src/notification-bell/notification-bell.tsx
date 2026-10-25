"use client"

import { getNotificationsUnreadCountQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconButton, Icons, Popover, PopoverContent, PopoverTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { NotificationCenter } from "../notification-center"

/** The unread count is polled once a minute (WEB-2). */
export const UNREAD_POLL_MS = 60_000

/** Header bell with the unread count; opens the latest notifications and a link to the full inbox. */
export function NotificationBell() {
  const t = useT("notifications")
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ ...getNotificationsUnreadCountQuery(), refetchInterval: UNREAD_POLL_MS })
  const count = data?.count ?? 0
  const label = count > 0 ? t("bellWithCount", { count }) : t("bell")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className="relative inline-flex">
        <PopoverTrigger render={<IconButton icon={Icons.notification} aria-label={label} />} />
        {count > 0 ? (
          <span
            data-testid="unread-count"
            className="bg-primary text-primary-foreground pointer-events-none absolute end-0 top-0 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 font-semibold"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      <PopoverContent align="end" className="max-h-[75dvh] w-[min(24rem,calc(100vw-2rem))] gap-3 overflow-y-auto p-3">
        <NotificationCenter compact />
        <Link
          href="/notifications/"
          onClick={() => setOpen(false)}
          className="text-primary flex min-h-11 items-center justify-center text-sm font-medium underline-offset-4 hover:underline"
        >
          {t("viewAll")}
        </Link>
      </PopoverContent>
    </Popover>
  )
}
