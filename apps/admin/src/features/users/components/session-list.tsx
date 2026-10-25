"use client"

import type { SessionItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Active sessions of a user (read-only). */
export function SessionList({ sessions }: { sessions: SessionItem[] }) {
  const t = useT("account")
  const f = useFormatters()
  if (sessions.length === 0) return <p className="text-muted-foreground text-sm">{t("noSessions")}</p>
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-col gap-1 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium break-all">{session.user_agent ?? t("unknownDevice")}</p>
            {session.current ? <Badge variant="secondary">{t("currentSession")}</Badge> : null}
          </div>
          <p className="text-muted-foreground text-xs">
            {[session.ip, t("lastSeen", { date: f.dateTime(session.last_seen_at) }), session.amr.join(" + ")]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  )
}
