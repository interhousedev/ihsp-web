"use client"

import type { ConnectorCreated } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CopyButton,
} from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"
import { connectorConfigSnippet } from "../utils/connector-config"

/** UF-MCP-01 step 5 (MCP-2): the token is shown once, with the config snippet for the AI client. */
export function ConnectorTokenView({ created, onDone }: { created: ConnectorCreated; onDone: () => void }) {
  const t = useTr()
  const snippet = connectorConfigSnippet(getConfig().MCP_URL, created.connector.server, created.token)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("connectors.created.title", { name: created.connector.name })}</CardTitle>
        <CardDescription>{t("connectors.created.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert role="status">
          <AlertTitle>{t("connectors.created.onceTitle")}</AlertTitle>
          <AlertDescription>{t("connectors.created.once")}</AlertDescription>
        </Alert>
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("connectors.created.token")}</span>
          <code data-testid="connector-token" className="bg-muted rounded-lg p-3 text-sm break-all">
            {created.token}
          </code>
          <CopyButton value={created.token} label={t("connectors.created.copyToken")} />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("connectors.created.config")}</span>
          <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">{snippet}</pre>
          <CopyButton value={snippet} label={t("connectors.created.copyConfig")} />
        </div>
        <Button type="button" className="h-11 text-base" onClick={onDone}>
          {t("connectors.created.done")}
        </Button>
      </CardContent>
    </Card>
  )
}
