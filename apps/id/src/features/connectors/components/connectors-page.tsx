"use client"

import { getIdMeConnectorsQuery } from "@ihsp/api"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LinkButton } from "../../shared/components/link-button"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { ConnectorCard } from "./connector-card"

/** `/connectors/` (UF-MCP-04, ID-27): all connectors of the user, newest first. */
export function ConnectorsPage() {
  const t = useTr()
  const query = useQuery(getIdMeConnectorsQuery())
  return (
    <PageContainer
      title={t("connectors.title")}
      description={t("connectors.description")}
      actions={<LinkButton href="/connectors/new/">{t("connectors.new.action")}</LinkButton>}
    >
      <QueryBoundary query={query}>
        {(connectors) =>
          connectors.length === 0 ? (
            <StateView
              state="empty"
              emptyText={t("connectors.empty")}
              action={<LinkButton href="/connectors/new/">{t("connectors.new.action")}</LinkButton>}
            />
          ) : (
            <ul className="grid gap-3">
              {connectors
                .toSorted((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                .map((connector) => (
                  <li key={connector.id}>
                    <ConnectorCard connector={connector} />
                  </li>
                ))}
            </ul>
          )
        }
      </QueryBoundary>
    </PageContainer>
  )
}
