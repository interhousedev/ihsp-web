"use client"

import { getIdMeSessionsQuery } from "@ihsp/api"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { RevokeOthersButton } from "./revoke-others-button"
import { SessionRow } from "./session-row"

/** `/security/sessions/` (UF-ID-11, ID-17). */
export function SessionsPage() {
  const t = useTr()
  const query = useQuery(getIdMeSessionsQuery())
  const hasOthers = (query.data ?? []).some((session) => !session.current)
  return (
    <PageContainer
      title={t("security.sessions.title")}
      description={t("security.sessions.description")}
      actions={<RevokeOthersButton disabled={!hasOthers} />}
    >
      <QueryBoundary query={query}>
        {(sessions) =>
          sessions.length === 0 ? (
            <StateView state="empty" emptyText={t("security.sessions.empty")} />
          ) : (
            <ul className="grid gap-3">
              {sessions.map((session) => (
                <li key={session.id}>
                  <SessionRow session={session} />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </PageContainer>
  )
}
