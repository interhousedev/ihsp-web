"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { usePendingClubs } from "../clubs-api"
import Link from "next/link"
import type { ReactNode } from "react"

const TABS = [
  { href: "/activities/", key: "catalog" },
  { href: "/activities/clubs/", key: "clubs" },
  { href: "/activities/analytics/", key: "analytics" },
  { href: "/activities/media/", key: "media" },
] as const

/** The pages of the Activities section; the clubs tab shows the number of club applications, `end` sits at the right of the row. */
export function ActivitiesTabs({ current, end }: { current: (typeof TABS)[number]["key"]; end?: ReactNode }) {
  const pending = usePendingClubs()
  const t = useT("activities")
  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav aria-label={t("title")} className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === current ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium md:min-h-9",
              tab.key === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t(`tabs.${tab.key}`)}
            {tab.key === "clubs" && pending > 0 ? (
              <span className="bg-destructive text-destructive-foreground grid min-w-5 place-items-center rounded-full px-1.5 text-xs tabular-nums">
                {pending}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      {end ? <div className="ml-auto">{end}</div> : null}
    </div>
  )
}
