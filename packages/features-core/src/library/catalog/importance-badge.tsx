"use client"

import type { Importance } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"

const TONE: Record<Importance, string> = {
  essential: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  recommended:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  further: "text-muted-foreground",
}

/** Essential / Recommended / Further reading chip of a reading-list entry. */
export function ImportanceBadge({ importance, className }: { importance: Importance; className?: string }) {
  const t = useT("library.importance")
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[importance], className)}>
      {t(importance)}
    </Badge>
  )
}
