"use client"

import { getIdMeQuery, getMePrivacyErasureQuery } from "@ihsp/api"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { DataExportCard } from "./data-export-card"
import { DeleteAccountForm } from "./delete-account-form"
import { ErasurePendingCard } from "./erasure-pending-card"

/** `/security/delete/` (UF-ID-16, ID-29): export the data, then request deletion or follow and cancel the open request. */
export function DeleteAccountPage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  const erasure = useQuery(getMePrivacyErasureQuery())
  return (
    <PageContainer title={t("security.delete.title")}>
      <div className="grid gap-4">
        <DataExportCard />
        <QueryBoundary query={erasure}>
          {(open) =>
            open.request ? (
              <ErasurePendingCard request={open.request} />
            ) : (
              <QueryBoundary query={me}>{(user) => <DeleteAccountForm user={user} />}</QueryBoundary>
            )
          }
        </QueryBoundary>
      </div>
    </PageContainer>
  )
}
