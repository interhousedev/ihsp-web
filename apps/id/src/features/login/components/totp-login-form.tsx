"use client"

import { isApiError, postIdLoginTotp } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton, TotpCodeForm, useTr } from "@ihsp/features-core/id-account"
import { followChallengeUsed, withChallenge } from "../../shared/utils/challenge"
import { applyLoginResult, type SecondFactor } from "../utils/login-result"

type TotpLoginFormProps = {
  challenge: string
  factor: SecondFactor
  onBack: () => void
}

/**
 * Second step after the password when the authenticator app is on: its code or a recovery code. While the vault is
 * sealed the app's key cannot be read (`id/vault-sealed`); the one-time code login needs no vault, so it is offered.
 */
export function TotpLoginForm({ challenge, factor, onBack }: TotpLoginFormProps) {
  const t = useTr()
  const submit = useMutation({
    mutationFn: (code: string) => postIdLoginTotp({ login_challenge: challenge, ticket: factor.ticket, code }),
    onSuccess: (result) => applyLoginResult(result, () => undefined),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const sealed = isApiError(submit.error) && submit.error.type === "id/vault-sealed"

  return (
    <FlowCard title={t("login.totp.title")} description={t("login.totp.description")}>
      <TotpCodeForm
        submitLabel={t("login.secondFactor.submit")}
        pending={submit.isPending}
        error={submit.error}
        onSubmit={(code) => submit.mutate(code)}
      />
      {sealed ? (
        <LinkButton href={withChallenge("/login/otp/", "login_challenge", challenge)} variant="outline">
          {t("login.withOtp")}
        </LinkButton>
      ) : null}
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("login.secondFactor.back")}
      </Button>
    </FlowCard>
  )
}
