"use client"

import { getNotebooksQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { notebookHref, NOTEBOOKS_HREF } from "../../../notebooks/utils/hrefs"
import { spanOf, type Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"

/** The notebooks the student opened or changed last, newest first. */
export function NotebookRecentsWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const f = useFormatters()
  const query = useQuery(getNotebooksQuery())
  const { rows } = spanOf(widget.size)
  const items = [...(query.data?.items ?? [])]
    .toSorted((a, b) => (b.last_opened_at ?? b.updated_at).localeCompare(a.last_opened_at ?? a.updated_at))
    .slice(0, rows <= 1 ? 2 : rows * 3)
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.notebook_recents")}
      href={NOTEBOOKS_HREF}
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {items.length === 0 ? (
        <CardEmpty icon={Icons.chat} text={t("noNotebooks")} />
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 text-xs">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col">
              {editing ? (
                <span className="truncate text-sm font-medium">{item.title}</span>
              ) : (
                <Link
                  href={notebookHref(item.id)}
                  className="truncate text-sm font-medium underline-offset-2 hover:underline"
                >
                  {item.emoji ? `${item.emoji} ` : ""}
                  {item.title}
                </Link>
              )}
              <span className="opacity-80">{f.relative(item.last_opened_at ?? item.updated_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetFrame>
  )
}
