"use client"

import { useState } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { useClientHint } from "../hooks/use-client-hint"
import { useLoginInfo } from "../hooks/use-login-info"
import type { SecondFactor } from "../utils/login-result"
import { NewPasswordForm } from "./new-password-form"
import { PasswordLoginForm, type PasswordCredentials } from "./password-login-form"
import { SecondFactorForm } from "./second-factor-form"

type SecondFactorState = { credentials: PasswordCredentials; factor: SecondFactor }

/** The login steps for one challenge: password, then (when asked) the second factor. */
export function LoginFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const hint = useClientHint()
  // The hint only draws the form early; the client name and `skip` always come from the server.
  const { query, redirecting } = useLoginInfo(challenge)
  const [secondFactor, setSecondFactor] = useState<SecondFactorState | null>(null)
  const [passwordTicket, setPasswordTicket] = useState<string | null>(null)

  if (redirecting) return <FlowSkeleton />
  const info = query.data ?? hint
  if (!info) {
    if (!query.isError) return <FlowSkeleton />
    return <RequestFailed title={t("login.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
  if (passwordTicket) return <NewPasswordForm challenge={challenge} ticket={passwordTicket} />
  if (secondFactor) {
    return (
      <SecondFactorForm
        challenge={challenge}
        credentials={secondFactor.credentials}
        factor={secondFactor.factor}
        onFactor={(factor) => setSecondFactor({ credentials: secondFactor.credentials, factor })}
        onBack={() => setSecondFactor(null)}
      />
    )
  }
  return (
    <PasswordLoginForm
      challenge={challenge}
      info={info}
      onSecondFactor={(credentials, factor) => setSecondFactor({ credentials, factor })}
      onPasswordChange={setPasswordTicket}
    />
  )
}
