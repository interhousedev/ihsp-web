"use client"

import type { AuditItem } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"
import { describeDevice } from "../../shared/utils/describe-device"
import { activityLabel } from "../utils/activity-label"

/** One security event: what happened, when, from which IP and device. */
export function ActivityRow({ item }: { item: AuditItem }) {
  const t = useTr()
  const format = useFormatters()
  const device = describeDevice(item.user_agent)
  const where = [item.ip, device.browser, device.os].filter(Boolean).join(" · ")
  return (
    <Card>
      <CardContent className="grid gap-1">
        <span className="font-medium">{activityLabel(t, item.type)}</span>
        <span className="text-muted-foreground text-sm">{format.dateTime(item.created_at)}</span>
        {where ? <span className="text-muted-foreground text-sm">{where}</span> : null}
        {item.actor ? (
          <span className="text-muted-foreground text-sm">
            {t("security.activity.by", { name: `${item.actor.first_name} ${item.actor.last_name}` })}
          </span>
        ) : null}
      </CardContent>
    </Card>
  )
}
