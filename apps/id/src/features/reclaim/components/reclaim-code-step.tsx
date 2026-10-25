"use client"

import { postReclaimComplete, postReclaimEmail, type ReclaimStart } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { CodeStep } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type ReclaimCodeStepProps = {
  start: ReclaimStart
  password: string
  email: string
  onBack: () => void
  onDone: () => void
}

/** Step 3 of the reclaim: the emailed code completes it; every old session is revoked by the backend. */
export function ReclaimCodeStep({ start, password, email, onBack, onDone }: ReclaimCodeStepProps) {
  const t = useTr()
  const complete = useMutation({
    mutationFn: (code: string) =>
      postReclaimComplete({ reclaim_token: start.reclaim_token, new_password: password, email_code: code }),
    onSuccess: onDone,
  })
  const resend = useMutation({ mutationFn: () => postReclaimEmail({ reclaim_token: start.reclaim_token, email }) })
  return (
    <FlowCard title={t("reclaim.code.title")} description={t("reclaim.code.description", { email })}>
      <StepIndicator current={3} total={3} />
      <CodeStep
        submitLabel={t("reclaim.code.submit")}
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
