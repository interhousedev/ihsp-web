"use client"

import { useState } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { useClientHint } from "../hooks/use-client-hint"
import { useLoginInfo } from "../hooks/use-login-info"
import type { SecondFactor } from "../utils/login-result"
import { PasswordLoginForm, type PasswordCredentials } from "./password-login-form"
import { SecondFactorForm } from "./second-factor-form"

type SecondFactorState = { credentials: PasswordCredentials; factor: SecondFactor }

/** The login steps for one challenge: password, then (when asked) the second factor. */
export function LoginFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const hint = useClientHint()
  const { query, redirecting } = useLoginInfo(challenge, { enabled: hint === null })
  const [secondFactor, setSecondFactor] = useState<SecondFactorState | null>(null)

  if (redirecting) return <FlowSkeleton />
  const info = hint ?? query.data
  if (!info) {
    if (!query.isError) return <FlowSkeleton />
    return <RequestFailed title={t("login.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
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
    />
  )
}
