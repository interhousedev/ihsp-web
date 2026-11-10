"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useAnnouncements } from "../../hooks/use-today"
import { spanOf, type Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"

/** The latest broadcasts; 1x1 is the count, wider tiles list titles with their age. */
export function AnnouncementsWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.announcements")
  const d = useT("today.dashboard")
  const f = useFormatters()
  const query = useAnnouncements()
  const items = query.data?.items ?? []
  const { rows } = spanOf(widget.size)
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("title")}
      href="/notifications/"
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {items.length === 0 ? (
        <CardEmpty text={d("noAnnouncements")} />
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 text-xs">
          {items.slice(0, rows <= 1 ? 2 : rows * 3).map((item) => (
            <li key={item.id} className="flex flex-col">
              <span className="truncate text-sm font-medium">{item.title}</span>
              <span className="opacity-80">{f.relative(item.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetFrame>
  )
}
