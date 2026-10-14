"use client"

import { isApiError, postLoginOtp, postLoginOtpRequest } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CodeStep } from "../../shared/components/code-step"
import { InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { RestoreAccountForm } from "../../login/components/restore-account-form"
import { applyLoginResult, type AccountRestore } from "../../login/utils/login-result"

/** ID-14: three attempts per code. */
const MAX_ATTEMPTS = 3

type OtpCodeFormProps = { challenge: string; login: string; onChangeLogin: () => void }

/** UF-ID-03 steps 3-4: the code, with attempts left and **Send new code** after 60 seconds. */
export function OtpCodeForm({ challenge, login, onChangeLogin }: OtpCodeFormProps) {
  const t = useTr()
  const [failures, setFailures] = useState(0)
  const [restore, setRestore] = useState<AccountRestore | null>(null)
  const submit = useMutation({
    mutationFn: (code: string) => postLoginOtp({ login_challenge: challenge, login, code }),
    onSuccess: (result) => applyLoginResult(result, () => undefined, undefined, setRestore),
    onError: (error) => {
      if (followChallengeUsed(error)) return
      if (isApiError(error) && error.type === "auth/otp-invalid") setFailures((count) => count + 1)
    },
  })
  const resend = useMutation({
    mutationFn: () => postLoginOtpRequest({ login_challenge: challenge, login }),
    onSuccess: () => setFailures(0),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failures)

  if (restore) return <RestoreAccountForm challenge={challenge} restore={restore} onExpired={onChangeLogin} />

  return (
    <FlowCard title={t("loginOtp.codeTitle")} description={t("loginOtp.codeDescription")}>
      <InfoAlert>{t("loginOtp.neutral")}</InfoAlert>
      <CodeStep
        submitLabel={t("loginOtp.submit")}
        pending={submit.isPending}
        error={submit.error ?? resend.error}
        onSubmit={(code) => submit.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
        disabled={attemptsLeft === 0}
      >
        {failures > 0 ? (
          <p role="status" className="text-muted-foreground text-sm">
            {attemptsLeft > 0 ? t("loginOtp.attemptsLeft", { count: attemptsLeft }) : t("loginOtp.codeInvalidated")}
          </p>
        ) : null}
      </CodeStep>
      <Button type="button" variant="ghost" className="h-11" onClick={onChangeLogin}>
        {t("loginOtp.changeLogin")}
      </Button>
    </FlowCard>
  )
}
