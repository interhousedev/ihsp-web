"use client"

import { deleteConnector, keys, type Connector } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, ConfirmDialog } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

const SERVER_KEYS = {
  student: "connectors.server.student",
  lms: "connectors.server.lms",
  admin: "connectors.server.admin",
} as const

function isExpired(connector: Connector): boolean {
  return connector.expires_at !== null && new Date(connector.expires_at).getTime() < Date.now()
}

/** MCP-4: one connector with its server, scopes, dates, and **Revoke** (immediate, with a confirmation). */
export function ConnectorCard({ connector }: { connector: Connector }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const revoke = useMutation({
    mutationFn: () => deleteConnector(connector.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.id.connectors() })
      setConfirming(false)
    },
  })
  const revoked = connector.revoked_at !== null
  const expired = !revoked && isExpired(connector)

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <span className="font-medium break-words">{connector.name}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t(SERVER_KEYS[connector.server])}</Badge>
              <Badge variant="outline">
                {connector.kind === "oauth" ? t("connectors.kind.oauth") : t("connectors.kind.token")}
              </Badge>
              {revoked ? <Badge variant="destructive">{t("connectors.revoked")}</Badge> : null}
              {expired ? <Badge variant="destructive">{t("connectors.expired")}</Badge> : null}
            </div>
          </div>
          {revoked ? null : (
            <Button type="button" variant="outline" className="h-11" onClick={() => setConfirming(true)}>
              {t("connectors.revoke")}
            </Button>
          )}
        </div>
        <ul className="flex flex-wrap gap-1" aria-label={t("connectors.scopes")}>
          {connector.scopes.map((scope) => (
            <li key={scope}>
              <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{scope}</code>
            </li>
          ))}
        </ul>
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt>{t("connectors.createdAt")}</dt>
          <dd>{connector.created_at ? format.dateTime(connector.created_at) : "—"}</dd>
          <dt>{t("connectors.lastUsed")}</dt>
          <dd>{connector.last_used_at ? format.dateTime(connector.last_used_at) : t("connectors.never")}</dd>
          <dt>{t("connectors.expires")}</dt>
          <dd>{connector.expires_at ? format.dateTime(connector.expires_at) : t("connectors.noExpiry")}</dd>
        </dl>
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("connectors.revokeTitle", { name: connector.name })}
        description={t("connectors.revokeDescription")}
        confirmLabel={t("connectors.revoke")}
        destructive
        loading={revoke.isPending}
        onConfirm={() => revoke.mutate()}
      >
        <ErrorAlert error={revoke.error} />
      </ConfirmDialog>
    </Card>
  )
}
