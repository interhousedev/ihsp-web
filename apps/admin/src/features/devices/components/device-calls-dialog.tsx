"use client"

import { type DeviceOut, getAdminDeviceCallsQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"

/** The requests of one device in the last 7 days: when, the outcome and who was recognised. */
export function DeviceCallsDialog({ device, onClose }: { device: DeviceOut; onClose: () => void }) {
  const t = useT("devices")
  const f = useFormatters()
  const calls = useQuery(getAdminDeviceCallsQuery(device.id))
  const rows = calls.data?.items ?? []

  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("callsTitle", { name: device.name })}
      description={t("callsHint")}
    >
      {calls.isPending ? (
        <StateView state="loading" />
      ) : calls.isError ? (
        <StateView state="error" error={calls.error} onRetry={() => void calls.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t("callsEmpty")} />
      ) : (
        <ul className="grid gap-2" aria-label={t("callsTitle", { name: device.name })}>
          {rows.map((call) => (
            <li key={call.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
              <span className="grid gap-0.5">
                <span className="font-medium">{call.matched_name ?? t("callsNobody")}</span>
                <span className="text-muted-foreground text-xs">{f.dateTime(call.at)}</span>
              </span>
              <span className="flex gap-2">
                <Badge variant="outline">{call.status}</Badge>
                {call.excused ? <Badge variant="secondary">{t("callsExcused")}</Badge> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveDialog>
  )
}
