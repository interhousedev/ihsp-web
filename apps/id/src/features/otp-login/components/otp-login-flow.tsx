"use client"

import { useState } from "react"
import { useLoginInfo } from "../../login/hooks/use-login-info"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { OtpCodeForm } from "./otp-code-form"
import { OtpRequestForm } from "./otp-request-form"

/** The OTP login steps for one challenge: the login, then the code. */
export function OtpLoginFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const { query, redirecting } = useLoginInfo(challenge)
  const [login, setLogin] = useState<string | null>(null)

  if (redirecting || query.isPending) return <FlowSkeleton />
  if (query.isError) {
    return <RequestFailed title={t("login.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
  if (login === null)
    return <OtpRequestForm challenge={challenge} clientName={query.data.client_name} onSent={setLogin} />
  return <OtpCodeForm challenge={challenge} login={login} onChangeLogin={() => setLogin(null)} />
}
