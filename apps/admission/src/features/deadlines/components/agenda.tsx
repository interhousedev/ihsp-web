"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, Skeleton, StateView, StatusBadge } from "@ihsp/ui"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { ScrollFade } from "../../../components/scroll-fade"
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
  if (query.data.length === 0)
    return <StateView state="empty" icon={<Icons.calendar className="size-8" />} title={t("empty")} />
  const rows = [...query.data].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  return (
    <ScrollFade maxHeight="calc(100dvh - 16rem)">
      <ul className="flex flex-col gap-2">
        {rows.map((item) => {
          const overdue = !item.predicted && item.due_utc !== null && new Date(item.due_utc).getTime() < now
          return (
            <li
              key={item.id}
              className={`bg-card flex flex-wrap items-center justify-between gap-2 rounded-card border border-l-4 p-3 ${item.predicted ? "border-dashed border-l-muted-foreground" : overdue ? "border-l-destructive" : "border-l-primary"}`}
            >
              <div className="flex items-center gap-3">
                <LogoAvatar
                  name={item.institution_name ?? ""}
                  src={item.logo_url}
                  fit={item.logo_fit}
                  zoom={item.logo_zoom}
                  className="size-8 ring-0"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{item.institution_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {t.has(`milestone.${item.kind}`) ? t(`milestone.${item.kind}`) : item.kind}
                  </span>
                </div>
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
    </ScrollFade>
  )
}
