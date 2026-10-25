"use client"

import { postLogin, postLoginOtp } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@ihsp/ui"
import { CodeStep } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { InfoAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { applyLoginResult, type SecondFactor } from "../utils/login-result"
import type { PasswordCredentials } from "./password-login-form"

type SecondFactorFormProps = {
  challenge: string
  credentials: PasswordCredentials
  factor: SecondFactor
  /** A new code was requested: the backend issued a new ticket. */
  onFactor: (factor: SecondFactor) => void
  onBack: () => void
}

const CHANNEL_KEYS = { telegram: "login.channel.telegram", email: "login.channel.email" } as const

/** Second factor after a correct password (always for Administration): the code goes to every OTP channel. */
export function SecondFactorForm({ challenge, credentials, factor, onFactor, onBack }: SecondFactorFormProps) {
  const t = useTr()
  const submit = useMutation({
    mutationFn: (code: string) =>
      postLoginOtp({ login_challenge: challenge, login: credentials.login.trim(), code, ticket: factor.ticket }),
    onSuccess: (result) => applyLoginResult(result, onFactor),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  // The backend has no separate resend route for a second factor: repeating the password step issues a new ticket.
  const resend = useMutation({
    mutationFn: () =>
      postLogin({
        login_challenge: challenge,
        login: credentials.login.trim(),
        password: credentials.password,
        remember: credentials.remember,
      }),
    onSuccess: (result) => applyLoginResult(result, onFactor),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const channels = factor.channels.map((channel) => t(CHANNEL_KEYS[channel])).join(", ")

  return (
    <FlowCard title={t("login.secondFactor.title")} description={t("login.secondFactor.description")}>
      <InfoAlert>{t("login.secondFactor.sent", { channels })}</InfoAlert>
      <CodeStep
        submitLabel={t("login.secondFactor.submit")}
        pending={submit.isPending}
        error={submit.error ?? resend.error}
        onSubmit={(code) => submit.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("login.secondFactor.back")}
      </Button>
    </FlowCard>
  )
}
