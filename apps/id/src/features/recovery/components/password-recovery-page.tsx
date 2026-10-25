"use client"

import { postIdRecoveryPasswordRequest } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { FlowCard } from "../../shared/components/flow-card"
import { SingleFieldForm } from "../../shared/components/single-field-form"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"
import { PasswordRecoveryConfirm } from "./password-recovery-confirm"
import { PasswordRecoveryDone } from "./password-recovery-done"

type Step = { kind: "request" } | { kind: "confirm"; identifier: string } | { kind: "done"; ticket: string }

/** `/recovery/password/` (UF-ID-07): login or email, then the emailed code and a new password. */
export function PasswordRecoveryPage() {
  const t = useTr()
  const [step, setStep] = useState<Step>({ kind: "request" })
  const request = useMutation({
    mutationFn: (identifier: string) => postIdRecoveryPasswordRequest({ login_or_email: identifier }),
    onSuccess: (_result, identifier) => setStep({ kind: "confirm", identifier }),
  })

  if (step.kind === "done") return <PasswordRecoveryDone ticket={step.ticket} />
  if (step.kind === "confirm") {
    return (
      <PasswordRecoveryConfirm identifier={step.identifier} onDone={(ticket) => setStep({ kind: "done", ticket })} />
    )
  }
  return (
    <FlowCard
      title={t("recovery.password.title")}
      description={t("recovery.password.description")}
      footer={<TextLink href="/security/">{t("recovery.backToLogin")}</TextLink>}
    >
      <SingleFieldForm
        label={t("recovery.password.identifier")}
        kind="text"
        autoComplete="username"
        submitLabel={t("recovery.password.request")}
        pending={request.isPending}
        error={request.error}
        onSubmit={(identifier) => request.mutate(identifier)}
      />
    </FlowCard>
  )
}
