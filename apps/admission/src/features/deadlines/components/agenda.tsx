"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { useNow } from "../../../lib/use-now"
import { useMyDeadlines, type Milestone } from "../api"

function sortKey(item: Milestone) {
  return item.due_utc ?? "9999"
}

/** My milestones by date. A predicted date is dashed and never shown as overdue. */
export function Agenda() {
  const t = useT("deadlines")
  const { date } = useFormatters()
  const query = useMyDeadlines()
  const now = useNow()
  if (query.isPending) return <Skeleton className="h-32 w-full" />
  if (query.isError) return <StateView state="error" onRetry={() => void query.refetch()} />
  if (query.data.length === 0) return <StateView state="empty" title={t("empty")} />
  const rows = [...query.data].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((item) => {
        const overdue = !item.predicted && item.due_utc !== null && new Date(item.due_utc).getTime() < now
        return (
          <li
            key={item.id}
            className={`bg-card flex flex-wrap items-center justify-between gap-2 rounded-card border p-3 ${item.predicted ? "border-dashed" : ""}`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{item.institution_name}</span>
              <span className="text-muted-foreground text-xs">
                {t.has(`milestone.${item.kind}`) ? t(`milestone.${item.kind}`) : item.kind}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.due_utc ? date(item.due_utc) : t("noDate")}</span>
              {item.predicted && <StatusBadge tone="neutral" label={t("predicted")} />}
              {overdue && <StatusBadge tone="destructive" label={t("overdue")} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
