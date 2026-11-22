"use client"

import { getIdMeQuery } from "@ihsp/api"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { SecurityOverview } from "./security-overview"
import { AiTracingCard } from "./ai-tracing-card"

/** `/` and `/security/`: the security overview. */
export function SecurityPage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  return (
    <PageContainer title={t("security.title")}>
      <QueryBoundary query={me}>
        {(user) => (
          <div className="grid gap-4">
            <SecurityOverview user={user} />
            <AiTracingCard user={user} />
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
