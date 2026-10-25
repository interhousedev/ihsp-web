"use client"

import { getIdLogout, keys } from "@ihsp/api"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { FlowCard } from "../../shared/components/flow-card"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { challengeUsedTarget } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"

/** Accepts the logout challenge and follows the `redirect_to` of the answer (or of a used challenge). */
export function LogoutFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const query = useQuery({
    queryKey: keys.id.logout(challenge),
    queryFn: ({ signal }) => getIdLogout(challenge, { signal }),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const target = query.data?.redirect_to ?? challengeUsedTarget(query.error)

  useEffect(() => {
    if (target) redirectTo(target)
  }, [target])

  if (query.isError && !target) {
    return <RequestFailed title={t("logout.failed")} error={query.error} onRetry={() => void query.refetch()} />
  }
  return (
    <FlowCard title={t("logout.title")} description={t("logout.description")}>
      <StateView state="loading" />
    </FlowCard>
  )
}
