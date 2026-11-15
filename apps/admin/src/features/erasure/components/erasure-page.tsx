"use client"

import { getAdminErasureRequestsQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ErasureDecisionDialog, type ErasureDecision } from "./erasure-decision-dialog"
import { ErasureRequestItem } from "./erasure-request-item"

/** Erasure requests: users who asked to delete their account; an administrator approves or rejects each one. */
export function ErasurePage() {
  const t = useT("erasure")
  const requests = useQuery(getAdminErasureRequestsQuery({ limit: 100 }))
  const [decision, setDecision] = useState<ErasureDecision | null>(null)
  const rows = requests.data?.items ?? []

  return (
    <PageContainer title={t("title")}>
      {requests.isPending ? (
        <StateView state="loading" />
      ) : requests.isError ? (
        <StateView state="error" error={requests.error} onRetry={() => void requests.refetch()} />
      ) : rows.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ul className="grid gap-2" aria-label={t("title")}>
          {rows.map((request) => (
            <ErasureRequestItem key={request.id} request={request} onDecide={setDecision} />
          ))}
        </ul>
      )}
      {decision ? <ErasureDecisionDialog decision={decision} onClose={() => setDecision(null)} /> : null}
    </PageContainer>
  )
}
