"use client"

import { getAdminInsightsQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons, Stat } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { share } from "../utils"

function Up({ ok }: { ok: boolean }) {
  const t = useT("reports.health")
  return <Badge variant={ok ? "secondary" : "destructive"}>{ok ? t("up") : t("down")}</Badge>
}

/** Services that answer now, the job queue and the failed sign-in rate of the last day. */
export function HealthTab() {
  const t = useT("reports.health")
  const f = useFormatters()
  const query = useQuery({ ...getAdminInsightsQuery(), refetchInterval: 30_000 })
  return (
    <QueryState query={query} rows={3}>
      {({ system, generated_at }) => {
        const attempts = system.logins_24h + system.failed_logins_24h
        const failedShare = share(system.failed_logins_24h, attempts)
        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label={t("database")} value={<Up ok={system.db} />} icon={<Icons.monitoring aria-hidden />} />
              <Stat label={t("redis")} value={<Up ok={system.redis} />} icon={<Icons.monitoring aria-hidden />} />
              <Stat
                label={t("queueWaiting")}
                value={system.queue_lag ?? "—"}
                hint={t("queueHint", { count: system.queue_pending ?? 0 })}
              />
              <Stat
                label={t("failedLogins")}
                value={attempts === 0 ? "—" : `${failedShare}%`}
                hint={t("loginsHint", { failed: system.failed_logins_24h, total: attempts })}
              />
            </div>
            <p className="text-muted-foreground text-xs">{t("updated", { time: f.dateTime(generated_at) })}</p>
          </div>
        )
      }}
    </QueryState>
  )
}
