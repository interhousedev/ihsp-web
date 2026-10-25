"use client"

import { postIdActivationEmail, type ActivationInfo } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { PasswordEmailForm, type PasswordEmailValues } from "../../shared/components/password-email-form"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type ActivationFormProps = {
  token: string
  info: ActivationInfo
  onSent: (values: { password: string; email: string }) => void
}

/** Step 1 of the activation: the staff member's name and login, a new password and a recovery email. */
export function ActivationForm({ token, info, onSent }: ActivationFormProps) {
  const t = useTr()
  const mutation = useMutation({
    mutationFn: (values: PasswordEmailValues) => postIdActivationEmail(token, { email: values.email }),
    onSuccess: (_result, values) => onSent({ password: values.password, email: values.email }),
  })
  return (
    <FlowCard
      title={t("activate.title", { name: `${info.first_name} ${info.last_name}` })}
      description={t("activate.description")}
    >
      <StepIndicator current={1} total={2} />
      <dl className="bg-muted/50 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg p-3 text-sm">
        <dt className="text-muted-foreground">{t("activate.login")}</dt>
        <dd className="font-medium break-all">{info.login}</dd>
      </dl>
      <PasswordEmailForm
        submitLabel={t("activate.submit")}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </FlowCard>
  )
}
