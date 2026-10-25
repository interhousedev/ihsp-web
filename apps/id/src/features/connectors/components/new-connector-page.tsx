"use client"

import { getIdMcpScopesQuery, getIdMeQuery, keys, type ConnectorCreated } from "@ihsp/api"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { ConnectorTokenView } from "./connector-token-view"
import { NewConnectorForm } from "./new-connector-form"

/**
 * `/connectors/new/`. The token lives only in this component's state: it is never cached, stored or put into a URL,
 * so it is gone as soon as the user leaves the page (MCP-2).
 */
export function NewConnectorPage() {
  const t = useTr()
  const router = useRouter()
  const queryClient = useQueryClient()
  const catalog = useQuery(getIdMcpScopesQuery())
  const me = useQuery(getIdMeQuery())
  const [created, setCreated] = useState<ConnectorCreated | null>(null)
  const [leaving, setLeaving] = useState(false)

  function finish() {
    setCreated(null)
    setLeaving(true)
    void queryClient.invalidateQueries({ queryKey: keys.id.connectors() })
    router.push("/connectors/")
  }

  return (
    <PageContainer title={t("connectors.new.pageTitle")}>
      {leaving ? <StateView state="loading" /> : null}
      {created ? <ConnectorTokenView created={created} onDone={finish} /> : null}
      {!created && !leaving ? (
        <QueryBoundary query={catalog}>
          {(scopeCatalog) => (
            <QueryBoundary query={me}>
              {(user) => <NewConnectorForm catalog={scopeCatalog} user={user} onCreated={setCreated} />}
            </QueryBoundary>
          )}
        </QueryBoundary>
      ) : null}
    </PageContainer>
  )
}
