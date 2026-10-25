"use client"

import { postIdLoginTotp } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { TotpCodeForm } from "../../shared/components/totp-code-form"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { applyLoginResult, type SecondFactor } from "../utils/login-result"

type TotpLoginFormProps = {
  challenge: string
  factor: SecondFactor
  onBack: () => void
}

/** Second step after the password when the authenticator app is on: its code or a recovery code. */
export function TotpLoginForm({ challenge, factor, onBack }: TotpLoginFormProps) {
  const t = useTr()
  const submit = useMutation({
    mutationFn: (code: string) => postIdLoginTotp({ login_challenge: challenge, ticket: factor.ticket, code }),
    onSuccess: (result) => applyLoginResult(result, () => undefined),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })

  return (
    <FlowCard title={t("login.totp.title")} description={t("login.totp.description")}>
      <TotpCodeForm
        submitLabel={t("login.secondFactor.submit")}
        pending={submit.isPending}
        error={submit.error}
        onSubmit={(code) => submit.mutate(code)}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("login.secondFactor.back")}
      </Button>
    </FlowCard>
  )
}
