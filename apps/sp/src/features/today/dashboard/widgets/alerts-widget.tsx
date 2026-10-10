"use client"

import { useT } from "@ihsp/i18n"
import { useAlerts } from "../../hooks/use-today"
import { numberParam } from "../../utils/alert-text"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber, Lines, listRows } from "./shared"

/** What needs attention: the count, and from 2x1 up one line per alert. */
export function AlertsWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.alerts")
  const d = useT("today.dashboard")
  const alerts = useAlerts().data ?? []
  const text = (alert: (typeof alerts)[number]) => t(`short.${alert.kind}`, { count: numberParam(alert, "count") })
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("title")} href={alerts[0]?.action_url ?? "/settings/"}>
      {alerts.length === 0 ? (
        <span className="text-sm">{d("noAlerts")}</span>
      ) : widget.size === "1x1" ? (
        <BigNumber value={alerts.length} label={d("alertsCount")} />
      ) : (
        <Lines items={alerts.slice(0, listRows(widget) + 1).map(text)} />
      )}
    </WidgetFrame>
  )
}
