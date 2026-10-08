"use client"

import type { AuditItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { fullName } from "../../shared/utils/names"

/** Audit events of a user (read-only). */
export function AuditList({ events }: { events: AuditItem[] }) {
  const t = useT("account")
  const f = useFormatters()
  if (events.length === 0) return <p className="text-muted-foreground text-sm">{t("noAudit")}</p>
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-1 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium break-all">{event.type}</p>
            <time className="text-muted-foreground text-xs" dateTime={event.created_at}>
              {f.dateTime(event.created_at)}
            </time>
          </div>
          <p className="text-muted-foreground text-xs">
            {[event.actor ? fullName(event.actor) : null, event.ip].filter(Boolean).join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  )
}
