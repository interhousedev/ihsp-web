"use client"

import { postIdRecoveryOtpRequest } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { FlowCard } from "../../shared/components/flow-card"
import { SingleFieldForm } from "../../shared/components/single-field-form"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"
import { OtpRecoveryConfirm } from "./otp-recovery-confirm"
import { OtpRecoveryDone } from "./otp-recovery-done"

type Step = { kind: "request" } | { kind: "confirm"; login: string } | { kind: "done"; effectiveAt: string }

/** `/recovery/otp/` (UF-ID-08): reset OTP after losing Telegram; it takes effect 24 hours after the confirmation. */
export function OtpRecoveryPage() {
  const t = useTr()
  const [step, setStep] = useState<Step>({ kind: "request" })
  const request = useMutation({
    mutationFn: (login: string) => postIdRecoveryOtpRequest({ login }),
    onSuccess: (_result, login) => setStep({ kind: "confirm", login }),
  })

  if (step.kind === "done") return <OtpRecoveryDone effectiveAt={step.effectiveAt} />
  if (step.kind === "confirm") {
    return <OtpRecoveryConfirm login={step.login} onDone={(effectiveAt) => setStep({ kind: "done", effectiveAt })} />
  }
  return (
    <FlowCard
      title={t("recovery.otp.title")}
      description={t("recovery.otp.description")}
      footer={<TextLink href="/security/">{t("recovery.backToLogin")}</TextLink>}
    >
      <SingleFieldForm
        label={t("login.login")}
        kind="text"
        autoComplete="username"
        submitLabel={t("recovery.otp.request")}
        pending={request.isPending}
        error={request.error}
        onSubmit={(login) => request.mutate(login)}
      />
    </FlowCard>
  )
}
