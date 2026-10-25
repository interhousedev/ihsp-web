"use client"

import { getIdMeQuery } from "@ihsp/api"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { DeleteAccountForm } from "./delete-account-form"

/** `/security/delete/` (UF-ID-16, ID-29): what is deleted, what stays, then the password and an OTP. */
export function DeleteAccountPage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  return (
    <PageContainer title={t("security.delete.title")}>
      <QueryBoundary query={me}>{(user) => <DeleteAccountForm user={user} />}</QueryBoundary>
    </PageContainer>
  )
}
