"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import { useState } from "react"
import type { CaseloadItem } from "../../staff/api"

const WEEK_MS = 7 * 86_400_000

/** Role-specific counts of the caseload; each card has its own tint so the urgent ones stand out. */
export function StaffOverview({ items }: { items: CaseloadItem[] }) {
  const t = useT("home.staff")
  const [now] = useState(() => Date.now())
  const cards = [
    { key: "students", count: items.length, icon: Icons.teams, tint: "bg-primary/10 text-primary" },
    {
      key: "overdue",
      count: items.filter((item) => item.overdue > 0).length,
      icon: Icons.alertCircle,
      tint: "bg-destructive/10 text-destructive",
    },
    {
      key: "help",
      count: items.reduce((sum, item) => sum + item.open_help, 0),
      icon: Icons.inbox,
      tint: "bg-warning-muted text-warning",
    },
    {
      key: "dueSoon",
      count: items.filter((item) => item.next_due && Date.parse(item.next_due) - now <= WEEK_MS).length,
      icon: Icons.calendar,
      tint: "bg-success-muted text-success",
    },
  ] as const
  return (
    <ul aria-label={t("label")} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map(({ key, count, icon: Icon, tint }) => (
        <li
          key={key}
          className="bg-card border-hairline-strong rounded-card flex items-center gap-3 border p-4 shadow-sm"
        >
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tint)}>
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-semibold tabular-nums">{count}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{t(key)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
