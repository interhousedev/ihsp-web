"use client"

import { useT } from "@ihsp/i18n"
import { Icons, MOTION } from "@ihsp/ui"
import Link from "next/link"
import type { Item } from "../api"

/** One activity or honor: title, organization and the hours line, with a short enter animation. */
export function ItemCard({ item }: { item: Item }) {
  const t = useT("items")
  const hours =
    item.hours_per_week != null && item.weeks_per_year != null
      ? t("card.hours", { h: item.hours_per_week, w: item.weeks_per_year })
      : null
  return (
    <Link
      href={`/activities/view/?id=${encodeURIComponent(item.id)}`}
      className={`border-hairline bg-card hover:bg-muted/40 animate-in fade-in slide-in-from-bottom-1 flex min-h-11 flex-1 flex-col gap-1 rounded-card border p-3 transition-colors ${MOTION.slide}`}
    >
      <span className="font-medium">{item.title}</span>
      <span className="text-muted-foreground text-sm">{[item.organization, hours].filter(Boolean).join(" · ")}</span>
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <Icons.sparkles aria-hidden className="size-3.5" />
        {item.metrics.length > 0 ? t("card.metrics", { count: item.metrics.length }) : t("card.noMetrics")}
      </span>
    </Link>
  )
}
