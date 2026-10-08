"use client"

import type { NotificationItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import Link from "next/link"
import { TodayCard } from "./today-card"

/** The latest broadcasts (WEB-3): titles with their age; the full list is the Notifications page. */
export function AnnouncementsCard({ items }: { items: NotificationItem[] }) {
  const t = useT("today.announcements")
  const f = useFormatters()
  return (
    <TodayCard
      title={t("title")}
      action={
        <Link
          href="/notifications/"
          className="text-primary flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
        >
          {t("all")}
        </Link>
      }
    >
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href="/notifications/"
              className="hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col justify-center rounded-lg px-2 outline-none focus-visible:ring-2"
            >
              <span className="truncate text-sm font-medium">{item.title}</span>
              <span className="text-muted-foreground text-xs">{f.relative(item.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </TodayCard>
  )
}
