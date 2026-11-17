"use client"

import { useT } from "@ihsp/i18n"
import { StatCard, StatGrid } from "../../../components/lib/page"
import { useState } from "react"
import type { CaseloadItem } from "../../staff/api"

const WEEK_MS = 7 * 86_400_000

/** Role-specific counts of the caseload. */
export function StaffOverview({ items }: { items: CaseloadItem[] }) {
  const t = useT("home.staff")
  const [now] = useState(() => Date.now())
  const cards = [
    { key: "students", count: items.length, icon: "teams" },
    { key: "overdue", count: items.filter((item) => item.overdue > 0).length, icon: "alertCircle" },
    { key: "help", count: items.reduce((sum, item) => sum + item.open_help, 0), icon: "inbox" },
    {
      key: "dueSoon",
      count: items.filter((item) => item.next_due && Date.parse(item.next_due) - now <= WEEK_MS).length,
      icon: "calendar",
    },
  ] as const
  return (
    <section aria-label={t("label")}>
      <StatGrid>
        {cards.map(({ key, count, icon }) => (
          <StatCard key={key} label={t(key)} value={count} icon={icon} />
        ))}
      </StatGrid>
    </section>
  )
}
