"use client"

import { postIdActivation, postIdActivationEmail } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { CodeStep } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type ActivationCodeStepProps = {
  token: string
  password: string
  email: string
  onBack: () => void
  /** Called with the `redirect_to` of the activated account. */
  onDone: (redirect: string) => void
}

/** Step 2 of the activation: the emailed code activates the account. */
export function ActivationCodeStep({ token, password, email, onBack, onDone }: ActivationCodeStepProps) {
  const t = useTr()
  const complete = useMutation({
    mutationFn: (code: string) => postIdActivation(token, { password, email, email_code: code }),
    onSuccess: (result) => onDone(result.redirect_to),
  })
  const resend = useMutation({ mutationFn: () => postIdActivationEmail(token, { email }) })
  return (
    <FlowCard title={t("activate.code.title")} description={t("activate.code.description", { email })}>
      <StepIndicator current={2} total={2} />
      <CodeStep
        submitLabel={t("activate.code.submit")}
        pending={complete.isPending}
        error={complete.error ?? resend.error}
        onSubmit={(code) => complete.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("register.code.changeEmail")}
      </Button>
    </FlowCard>
  )
}
