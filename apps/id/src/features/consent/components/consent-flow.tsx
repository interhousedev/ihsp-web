"use client"

import { getIdConsentQuery, getIdMcpScopesQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { challengeUsedTarget } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"
import { ConsentForm } from "./consent-form"

/** Loads the consent request; first-party clients (`redirect_to` set) and used challenges are followed at once. */
export function ConsentFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const query = useQuery({
    ...getIdConsentQuery(challenge),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const catalog = useQuery({ ...getIdMcpScopesQuery(), staleTime: 5 * 60_000 })
  const target = query.data?.redirect_to ?? challengeUsedTarget(query.error)

  useEffect(() => {
    if (target) redirectTo(target)
  }, [target])

  if (target || query.isPending) return <FlowSkeleton />
  if (query.isError) {
    return <RequestFailed title={t("consent.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
  return <ConsentForm challenge={challenge} info={query.data} catalog={catalog.data} />
}
