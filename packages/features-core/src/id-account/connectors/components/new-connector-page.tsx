"use client"

import { getIdMcpScopesQuery, getIdMeQuery, keys, type ConnectorCreated } from "@ihsp/api"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { ConnectorTokenView } from "./connector-token-view"
import { McpSetupWizard } from "./mcp-setup-wizard"

/**
 * The MCP-5 wizard and the one-time token view, without a page around them (the page and the in-place dialog of the
 * apps share it). The token lives only in this component's state: it is never cached, stored or put into a URL, so it
 * is gone as soon as the flow is left (MCP-2). `onDone` runs when the user finishes after seeing the token.
 */
export function NewConnectorFlow({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const catalog = useQuery(getIdMcpScopesQuery())
  const me = useQuery(getIdMeQuery())
  const [created, setCreated] = useState<ConnectorCreated | null>(null)
  const [leaving, setLeaving] = useState(false)

  function finish() {
    setCreated(null)
    setLeaving(true)
    void queryClient.invalidateQueries({ queryKey: keys.id.connectors() })
    onDone()
  }

  return (
    <>
      {leaving ? <StateView state="loading" /> : null}
      {created ? <ConnectorTokenView created={created} onDone={finish} /> : null}
      {!created && !leaving ? (
        <QueryBoundary query={catalog}>
          {(scopeCatalog) => (
            <QueryBoundary query={me}>
              {(user) => <McpSetupWizard catalog={scopeCatalog} user={user} onTokenCreated={setCreated} />}
            </QueryBoundary>
          )}
        </QueryBoundary>
      ) : null}
    </>
  )
}

/** `/connectors/new/` (MCP-5 wizard) on the id app. */
export function NewConnectorPage() {
  const t = useTr()
  const router = useRouter()
  return (
    <PageContainer title={t("connectors.mcp.title")}>
      <NewConnectorFlow onDone={() => router.push("/connectors/")} />
    </PageContainer>
  )
}
