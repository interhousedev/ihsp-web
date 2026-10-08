"use client"

import type { Alert } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { numberParam, stringParam } from "../utils/alert-text"
import { TodayCard } from "./today-card"

/** What needs the student's attention (WEB-3): each alert with a button that fixes it. */
export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  const t = useT("today.alerts")
  const f = useFormatters()

  function message(alert: Alert): string {
    switch (alert.kind) {
      case "files_expiring": {
        const date = stringParam(alert, "date")
        return t("files_expiring", { count: numberParam(alert, "count"), date: date ? f.date(date) : "" })
      }
      case "pending_approvals":
        return t("pending_approvals", { count: numberParam(alert, "count") })
      case "emis_reauth":
        return t("emis_reauth")
      case "no_subgroup":
        return t("no_subgroup")
      case "sync_failed":
        return t("sync_failed")
    }
  }

  return (
    <TodayCard title={t("title")}>
      <ul className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <li key={alert.kind} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
            <span className="flex min-w-0 flex-1 items-start gap-2 text-sm">
              <Icons.warning className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              {message(alert)}
            </span>
            {alert.action_url ? (
              <LinkButton href={alert.action_url} className="shrink-0">
                {t(`actions.${alert.kind}`)}
              </LinkButton>
            ) : null}
          </li>
        ))}
      </ul>
    </TodayCard>
  )
}
