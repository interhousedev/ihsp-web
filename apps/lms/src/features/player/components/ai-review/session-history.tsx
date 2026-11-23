"use client"

import type { AiReviewSessionSummary } from "@ihsp/api"
import { formatDateTime, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, cn } from "@ihsp/ui"

/** My earlier conversations about the block, newest first; the open one is marked. */
export function SessionHistory({
  items,
  currentId,
  onPick,
}: {
  items: readonly AiReviewSessionSummary[]
  currentId: string | null
  onPick: (id: string) => void
}) {
  const t = useT("player")
  if (items.length === 0) return null
  return (
    <details className="rounded-lg border">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-medium md:min-h-9">
        <Icons.clock aria-hidden className="size-4" />
        {t("aiReview.history", { count: items.length })}
      </summary>
      <ul className="flex flex-col gap-1 border-t p-2">
        {items.map((item) => (
          <li key={item.id}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onPick(item.id)}
              aria-current={item.id === currentId ? "true" : undefined}
              className={cn(
                "h-auto min-h-11 w-full justify-between gap-2 md:min-h-9",
                item.id === currentId && "bg-muted",
              )}
            >
              <span className="text-sm">{formatDateTime(item.created_at)}</span>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {t("aiReview.submissionsUsed", { count: item.submissions_used })}
                </span>
                <Badge variant={item.status === "reviewed" ? "default" : "outline"}>
                  {t(`aiReview.status.${item.status}`)}
                </Badge>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </details>
  )
}
