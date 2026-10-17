"use client"

import { useState } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { useClientHint } from "../hooks/use-client-hint"
import { useLoginInfo } from "../hooks/use-login-info"
import { useTicketLogin } from "../hooks/use-ticket-login"
import type { AccountRestore, SecondFactor } from "../utils/login-result"
import { NewPasswordForm } from "./new-password-form"
import { PasswordLoginForm, type PasswordCredentials } from "./password-login-form"
import { RestoreAccountForm } from "./restore-account-form"
import { SecondFactorForm } from "./second-factor-form"
import { TotpLoginForm } from "./totp-login-form"

type SecondFactorState = { credentials: PasswordCredentials; factor: SecondFactor }

/** The login steps for one challenge: password, then (when asked) the second factor or the account restore. */
export function LoginFlow({ challenge }: { challenge: string }) {
  const t = useTr()
  const hint = useClientHint()
  // The hint only draws the form early; the client name and `skip` always come from the server.
  const { query, redirecting } = useLoginInfo(challenge)
  const redeeming = useTicketLogin(challenge)
  const [secondFactor, setSecondFactor] = useState<SecondFactorState | null>(null)
  const [passwordTicket, setPasswordTicket] = useState<string | null>(null)
  const [restore, setRestore] = useState<AccountRestore | null>(null)

  if (redirecting || redeeming) return <FlowSkeleton />
  const info = query.data ?? hint
  if (!info) {
    if (!query.isError) return <FlowSkeleton />
    return <RequestFailed title={t("login.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
  if (restore) return <RestoreAccountForm challenge={challenge} restore={restore} onExpired={() => setRestore(null)} />
  if (passwordTicket) return <NewPasswordForm challenge={challenge} ticket={passwordTicket} />
  if (secondFactor?.factor.method === "totp") {
    return <TotpLoginForm challenge={challenge} factor={secondFactor.factor} onBack={() => setSecondFactor(null)} />
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
      onPasswordChange={setPasswordTicket}
      onRestore={setRestore}
    />
  )
}
