"use client"

import { postReclaimEmail, type ReclaimStart } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { PasswordEmailForm, type PasswordEmailValues } from "../../shared/components/password-email-form"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type ReclaimPasswordStepProps = { start: ReclaimStart; onSent: (values: { password: string; email: string }) => void }

/** Step 2 of the reclaim: a new password and recovery email, then the code goes to that email. */
export function ReclaimPasswordStep({ start, onSent }: ReclaimPasswordStepProps) {
  const t = useTr()
  const mutation = useMutation({
    mutationFn: (values: PasswordEmailValues) =>
      postReclaimEmail({ reclaim_token: start.reclaim_token, email: values.email }),
    onSuccess: (_result, values) => onSent({ password: values.password, email: values.email }),
  })
  return (
    <FlowCard
      title={t("reclaim.password.title")}
      description={t("reclaim.password.description", { login: start.login })}
    >
      <StepIndicator current={2} total={3} />
      <InfoAlert>{t("reclaim.password.warning")}</InfoAlert>
      <PasswordEmailForm
        submitLabel={t("reclaim.password.submit")}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FlowCard>
  )
}
