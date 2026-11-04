"use client"

import type { ItemStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, type StatusTone, cn } from "@ihsp/ui"

const TONE: Record<ItemStatus, StatusTone> = {
  pending_review: "info",
  changes_requested: "warning",
  published: "success",
  held: "warning",
  rejected: "destructive",
  draft: "neutral",
  unpublished: "neutral",
  gone: "neutral",
}

/** The status chip of an upload: Draft, Waiting for review, Changes requested, Published, Held, Rejected, Removed. */
export function UploadStatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const t = useT("library.item.status")
  return (
    <Badge
      variant={TONE[status]}
      data-status={status}
      data-tone={TONE[status]}
      className={cn("font-medium", className)}
    >
      {t(status)}
    </Badge>
  )
}
