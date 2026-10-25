"use client"

import type { ItemStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"

const TONE: Partial<Record<ItemStatus, string>> = {
  pending_review: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  changes_requested:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  published:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  held: "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  rejected: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  draft: "text-muted-foreground",
  unpublished: "text-muted-foreground",
}

/** The status chip of an upload: Draft, Waiting for review, Changes requested, Published, Held, Rejected, Removed. */
export function UploadStatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const t = useT("library.item.status")
  return (
    <Badge variant="outline" data-status={status} className={cn("font-medium", TONE[status], className)}>
      {t(status)}
    </Badge>
  )
}
