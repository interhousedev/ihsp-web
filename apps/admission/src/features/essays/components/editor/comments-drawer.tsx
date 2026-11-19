"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Skeleton, StateView } from "@ihsp/ui"
import { useEssayFeedback } from "./feedback-api"

/** Guest feedback on the essay: who said what, the passage it points at, and whether it is resolved. */
export function CommentsDrawer({ essayId }: { essayId: string }) {
  const t = useT("essays")
  const fmt = useFormatters()
  const query = useEssayFeedback(essayId)
  if (query.isPending) return <Skeleton className="h-24 w-full" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (query.data.items.length === 0)
    return (
      <StateView state="empty" title={t("editor.comments.emptyTitle")} description={t("editor.comments.emptyText")} />
    )
  return (
    <ul className="flex flex-col gap-3" aria-label={t("tabs.comments")}>
      {query.data.items.map((item) => (
        <li key={item.id} className="border-hairline rounded-card flex flex-col gap-1.5 border p-3 text-sm">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{item.author_name}</span>
            <time className="text-muted-foreground text-xs" dateTime={item.created_at}>
              {fmt.dateTime(new Date(item.created_at))}
            </time>
          </p>
          {item.quote ? (
            <blockquote className="border-primary/40 text-muted-foreground border-l-2 pl-2 italic">
              {item.quote}
            </blockquote>
          ) : null}
          <p className="whitespace-pre-wrap">{item.body}</p>
          {item.detached ? (
            <span className="text-muted-foreground text-xs">{t("editor.comments.detached")}</span>
          ) : null}
          {item.resolved_at ? <span className="text-success text-xs">{t("editor.comments.resolved")}</span> : null}
        </li>
      ))}
    </ul>
  )
}
