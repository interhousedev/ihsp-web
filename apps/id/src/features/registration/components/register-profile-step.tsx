"use client"

import { postRegisterEmail, type RegistrationStart } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { InfoAlert } from "../../shared/components/error-alert"
import { PasswordEmailForm, type PasswordEmailValues } from "../../shared/components/password-email-form"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type RegisterProfileStepProps = {
  start: RegistrationStart
  onSent: (values: PasswordEmailValues) => void
  /** A name picked from the list has no login to show; the numeric EMIS login stays hidden. */
  hideLogin?: boolean
}

/** Step 2 (UF-ID-01 steps 5-7): confirm the imported profile, "Is this you?" for an import, password and email. */
export function RegisterProfileStep({ start, onSent, hideLogin = false }: RegisterProfileStepProps) {
  const t = useTr()
  const { profile, imported_match: match } = start
  const mutation = useMutation({
    mutationFn: (values: PasswordEmailValues) =>
      postRegisterEmail({ registration_token: start.registration_token, email: values.email }),
    onSuccess: (_result, values) => onSent(values),
  })
  const fullName = [profile.last_name, profile.first_name, profile.middle_name].filter(Boolean).join(" ")

  return (
    <FlowCard title={t("register.profile.title")} description={t("register.profile.description")}>
      <StepIndicator current={2} total={3} />
      <dl className="bg-muted/50 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg p-3 text-sm">
        <dt className="text-muted-foreground">{t("register.profile.name")}</dt>
        <dd className="font-medium">{fullName}</dd>
        <dt className="text-muted-foreground">{t("register.profile.group")}</dt>
        <dd className="font-medium">{profile.group_name}</dd>
        {hideLogin ? null : (
          <>
            <dt className="text-muted-foreground">{t("register.profile.login")}</dt>
            <dd className="font-medium break-all">{profile.login}</dd>
          </>
        )}
      </dl>
      {match ? (
        <InfoAlert>
          {t("register.profile.imported", { name: `${match.last_name} ${match.first_name}`, group: match.group_name })}
        </InfoAlert>
      ) : null}
      <PasswordEmailForm
        submitLabel={t("register.profile.submit")}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => mutation.mutate(values)}
        confirmation={
          match ? { label: t("register.profile.isThisYou"), required: match.needs_confirmation } : undefined
        }
      />
    </FlowCard>
  )
}
