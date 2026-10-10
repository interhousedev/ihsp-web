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

function percentOf(usage: UsageInfo): number {
  return Math.max(usagePercent(usage.session.used, usage.session.limit), usagePercent(usage.day.used, usage.day.limit))
}

/** Footer of the desktop sidebar: the one place where the two budgets (session, day) are shown in full. */
export function SidebarUsage({ usage }: { usage: UsageInfo | undefined }) {
  if (!usage || (usage.session.limit === null && usage.day.limit === null)) return null
  return (
    <div className="shrink-0 border-t px-3 pt-3 pb-1">
      <UsageBar usage={usage} stacked />
    </div>
  )
}

/** Compact meter for phones and a hidden sidebar: a ring that opens the same two budgets in a popover. */
export function UsageButton({ usage, className }: { usage: UsageInfo | undefined; className?: string }) {
  const t = useT("assistant")
  if (!usage || (usage.session.limit === null && usage.day.limit === null)) return null
  const percent = percentOf(usage)
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "hover:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3",
          className,
        )}
        aria-label={t("sidebar.usageRing", { percent })}
        title={t("usage.title")}
      >
        <UsageRing percent={percent} />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72">
        <UsageBar usage={usage} />
      </PopoverContent>
    </Popover>
  )
}
