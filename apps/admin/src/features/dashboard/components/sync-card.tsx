"use client"

import type { AdminDashboard } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { StatusBadge } from "../../shared/components/status-badge"

/** Status of the last EMIS sync run and how many students must enter their EMIS password again. */
export function SyncCard({ sync }: { sync: AdminDashboard["sync"] }) {
  const t = useT("dashboard")
  const f = useFormatters()
  const run = sync.last_run
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("syncTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {run ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">{t("syncLastRun")}</dt>
            <dd>{f.dateTime(run.started_at)}</dd>
            <dt className="text-muted-foreground">{t("syncStatus")}</dt>
            <dd>
              <StatusBadge status={run.status} />
            </dd>
            {Object.entries(run.stats).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-muted-foreground">{t("syncNever")}</p>
        )}
        <p>{t("syncNeedsReauth", { count: sync.needs_reauth })}</p>
        <Link
          href="/monitoring/"
          className={buttonVariants({ variant: "outline", className: "min-h-11 w-fit md:min-h-8" })}
        >
          {t("openMonitoring")}
        </Link>
      </CardContent>
    </Card>
  )
}
