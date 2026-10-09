"use client"

import type { UsageInfo } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Popover, PopoverContent, PopoverTrigger, cn } from "@ihsp/ui"
import { usagePercent } from "./limit-info"
import { UsageBar } from "./usage-bar"

const RADIUS = 11
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function UsageRing({ percent }: { percent: number }) {
  return (
    <svg viewBox="0 0 28 28" className="size-7 shrink-0 -rotate-90" aria-hidden>
      <circle cx="14" cy="14" r={RADIUS} fill="none" strokeWidth="3" className="stroke-muted-foreground/25" />
      <circle
        cx="14"
        cy="14"
        r={RADIUS}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
        className={cn(percent >= 100 ? "stroke-destructive" : "stroke-primary")}
      />
    </svg>
  )
}

/** Footer of the sidebar: a ring with the larger of the two budgets (session, day) that opens the usage bar. */
export function SidebarUsage({ usage }: { usage: UsageInfo | undefined }) {
  const t = useT("assistant")
  if (!usage) return null
  const percent = Math.max(
    usagePercent(usage.session.used, usage.session.limit),
    usagePercent(usage.day.used, usage.day.limit),
  )
  return (
    <Popover>
      <PopoverTrigger
        className="hover:bg-muted focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-3 rounded-full px-3 text-sm outline-none focus-visible:ring-3"
        aria-label={t("sidebar.usageRing", { percent })}
      >
        <UsageRing percent={percent} />
        <span className="text-muted-foreground">{t("usage.title")}</span>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72">
        <UsageBar usage={usage} />
      </PopoverContent>
    </Popover>
  )
}
