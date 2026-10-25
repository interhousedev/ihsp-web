"use client"

import type { ReactNode } from "react"

type PaneRailProps = {
  /** Already translated: "Show Sources". */
  label: string
  icon: ReactNode
  /** The source count under the icon. */
  badge?: number
  onExpand: () => void
}

/** What a collapsed side panel shows: one 56 px column with an icon (and a count) that expands the panel. */
export function PaneRail({ label, icon, badge, onExpand }: PaneRailProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="hover:bg-muted focus-visible:ring-ring flex h-full min-h-11 w-full flex-col items-center gap-2 pt-4 outline-none focus-visible:ring-2 focus-visible:ring-inset"
      onClick={onExpand}
    >
      <span aria-hidden className="flex size-6 items-center justify-center [&>svg]:size-6">
        {icon}
      </span>
      {badge === undefined ? null : (
        <span aria-hidden className="bg-muted text-muted-foreground rounded-full px-1.5 text-xs tabular-nums">
          {badge}
        </span>
      )}
    </button>
  )
}
