"use client"

import {
  type DeviceCreatedOut,
  type DeviceOut,
  clientConfigQuery,
  getAdminDevicesQuery,
  keys,
  postAdminDeviceRevoke,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, IconPlus, PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { DeviceCallsDialog } from "./device-calls-dialog"
import { DeviceCreateDialog } from "./device-create-dialog"
import { DeviceTokenDialog } from "./device-token-dialog"

/** Entrance devices: create one (the token is shown once), revoke it, and see its calls of the last 7 days. */
export function DevicesPage() {
  const t = useT("devices")
  const f = useFormatters()
  const devices = useQuery(getAdminDevicesQuery())
  const docsUrl = useQuery(clientConfigQuery()).data?.docs.entrance_devices_url
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<DeviceCreatedOut | null>(null)
  const [viewing, setViewing] = useState<DeviceOut | null>(null)
  const [revoking, setRevoking] = useState<DeviceOut | null>(null)
  const revoke = useAdminMutation({
    mutationFn: (device: DeviceOut) => postAdminDeviceRevoke(device.id),
    invalidate: [keys.admin.devices()],
    success: t("revoked"),
    onSuccess: () => setRevoking(null),
  })
  const rows = devices.data?.items ?? []

  return (
    <PageContainer
      title={t("title")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setCreating(true)}>
          <IconPlus aria-hidden /> {t("add")}
        </Button>
      }
    >
      {docsUrl ? (
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-block text-sm underline underline-offset-4"
        >
          {t("docs")}
        </a>
      ) : null}
      {devices.isPending ? (
        <StateView state="loading" />
      ) : devices.isError ? (
        <StateView state="error" error={devices.error} onRetry={() => void devices.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ul className="grid gap-2" aria-label={t("title")}>
          {rows.map((device) => (
            <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <span className="grid gap-1">
                <span className="flex items-center gap-2 font-medium">
                  {device.name}
                  <Badge variant={device.revoked_at ? "outline" : "secondary"}>
                    {device.revoked_at ? t("statusRevoked") : t("statusActive")}
                  </Badge>
                </span>
                <span className="text-muted-foreground font-mono text-xs">{device.key_prefix}…</span>
                <span className="text-muted-foreground text-xs">
                  {t("created", { date: f.dateTime(device.created_at) })}
                  {" · "}
                  {device.last_used_at ? t("lastUsed", { date: f.dateTime(device.last_used_at) }) : t("neverUsed")}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={TOUCH}
                  aria-label={t("viewCalls", { name: device.name })}
                  onClick={() => setViewing(device)}
                >
                  {t("calls")}
                </Button>
                {device.revoked_at ? null : (
                  <Button
                    type="button"
                    variant="outline"
                    className={TOUCH}
                    aria-label={t("revoke", { name: device.name })}
                    onClick={() => setRevoking(device)}
                  >
                    {t("revokeAction")}
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {creating ? (
        <DeviceCreateDialog
          onClose={() => setCreating(false)}
          onCreated={(device) => {
            setCreating(false)
            setCreated(device)
          }}
        />
      ) : null}
      {created ? <DeviceTokenDialog device={created} onClose={() => setCreated(null)} /> : null}
      {viewing ? <DeviceCallsDialog device={viewing} onClose={() => setViewing(null)} /> : null}
      {revoking ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setRevoking(null))}
          title={t("revokeTitle", { name: revoking.name })}
          description={t("revokeText")}
          confirmLabel={t("revokeAction")}
          destructive
          loading={revoke.isPending}
          onConfirm={() => revoke.mutate(revoking)}
        />
      ) : null}
    </PageContainer>
  )
}
