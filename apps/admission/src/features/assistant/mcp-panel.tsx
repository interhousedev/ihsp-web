"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { MemoryNotes } from "./memory-notes"
import { useMcpConnection } from "./mcp-api"
import { McpTokenCreate, McpTokenList } from "./mcp-tokens"

/** Connect external AI tools through MCP (token + config) and manage what the assistant remembers. */
export function McpPanel({ onBack }: { onBack: () => void }) {
  const t = useT("assistantDock.mcp")
  const connection = useMcpConnection()
  const [revoked, setRevoked] = useState(0)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4" data-testid="mcp-panel">
      <Button type="button" variant="ghost" className="min-h-11 self-start" onClick={onBack}>
        <Icons.chevronDown className="size-4 rotate-90" aria-hidden />
        {t("back")}
      </Button>
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold">{t("title")}</h3>
        {connection.data ? (
          <>
            <p className="text-muted-foreground text-sm break-all">{connection.data.url}</p>
            <McpTokenCreate connection={connection.data} codeResetKey={revoked} />
            <McpTokenList onRevoked={() => setRevoked((n) => n + 1)} />
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{connection.isError ? t("loadFailed") : t("loading")}</p>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold">{t("notesTitle")}</h3>
        <MemoryNotes />
      </section>
    </div>
  )
}
