"use client"

import { useSession } from "@ihsp/auth"
import { useT } from "@ihsp/i18n"
import { Badge, Button, buttonVariants, CopyButton, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { DOCUMENT_ROLES } from "../../config/nav"
import { MemoryNotes } from "./memory-notes"
import { useMcpConnection, type McpConnection } from "./mcp-api"
import { McpTokenCreate, McpTokenList } from "./mcp-tokens"

const STAFF_SCOPES = new Set(["caseload:read", "students:read", "students:write", "documents:review"])

function UrlLine({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 font-mono text-sm break-all">{url}</code>
        <CopyButton value={url} size="icon" />
      </div>
    </div>
  )
}

/** Sign-in from ChatGPT, Claude or Gemini (OAuth); the id app owns the connection steps. */
function OauthCard({ connection }: { connection: McpConnection }) {
  const t = useT("assistantDock.mcp")
  const { session } = useSession()
  const isStaff = !!session?.user.roles.some((role) => (DOCUMENT_ROLES as readonly string[]).includes(role))
  const staffOff = isStaff && !connection.oauth_scopes.some((scope) => STAFF_SCOPES.has(scope))
  return (
    <div className="bg-card flex flex-col gap-3 rounded-card border p-4" data-testid="mcp-oauth">
      <h4 className="font-medium">{t("oauthTitle")}</h4>
      <p className="text-muted-foreground text-sm">{t("oauthBody")}</p>
      <UrlLine label={t("serverUrl")} url={connection.url} />
      <UrlLine label={t("appUrl")} url={connection.app_url} />
      {connection.oauth_scopes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("scopes")}>
          {connection.oauth_scopes.map((scope) => {
            const key = `oauthScope.${scope.replace(/[.:]/g, "_")}`
            return (
              <li key={scope}>
                <Badge variant="secondary">{t.has(key) ? t(key) : scope}</Badge>
              </li>
            )
          })}
        </ul>
      )}
      {staffOff && <p className="text-muted-foreground text-sm">{t("staffOff")}</p>}
      <p className="text-muted-foreground text-xs">{t("consentNote")}</p>
      <a
        href={connection.connectors_url}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ className: "min-h-11 self-start" })}
      >
        {t("connect")}
      </a>
    </div>
  )
}

/** Connect external AI tools through MCP (OAuth first, personal token under Advanced) and manage what the assistant remembers. */
export function McpPanel({ onBack }: { onBack: () => void }) {
  const t = useT("assistantDock.mcp")
  const connection = useMcpConnection()
  const [revoked, setRevoked] = useState(0)

  let body
  if (connection.isPending)
    body = (
      <div className="flex flex-col gap-2" aria-label={t("loading")}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  else if (connection.isError)
    body = (
      <StateView
        state="error"
        title={t("loadFailed")}
        error={connection.error}
        onRetry={() => void connection.refetch()}
      />
    )
  else
    body = (
      <>
        <OauthCard connection={connection.data} />
        <details className="group flex flex-col gap-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">{t("advanced")}</summary>
          <div className="flex flex-col gap-4 pt-2">
            <McpTokenCreate connection={connection.data} codeResetKey={revoked} />
            <McpTokenList onRevoked={() => setRevoked((n) => n + 1)} />
          </div>
        </details>
      </>
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4" data-testid="mcp-panel">
      <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onBack}>
        <Icons.chevronDown className="size-4 rotate-90" aria-hidden />
        {t("back")}
      </Button>
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold">{t("title")}</h3>
        {body}
      </section>
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold">{t("notesTitle")}</h3>
        <MemoryNotes />
      </section>
    </div>
  )
}
