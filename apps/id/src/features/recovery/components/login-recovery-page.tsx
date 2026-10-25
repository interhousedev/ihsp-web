"use client"

import { postIdRecoveryLogin } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { InfoAlert } from "../../shared/components/error-alert"
import { SingleFieldForm } from "../../shared/components/single-field-form"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"

/** `/recovery/login/` (UF-ID-10): the login is emailed to the recovery address; the answer is always the same. */
export function LoginRecoveryPage() {
  const t = useTr()
  const mutation = useMutation({ mutationFn: (email: string) => postIdRecoveryLogin({ email }) })
  return (
    <FlowCard
      title={t("recovery.login.title")}
      description={t("recovery.login.description")}
      footer={<TextLink href="/security/">{t("recovery.backToLogin")}</TextLink>}
    >
      {mutation.isSuccess ? (
        <InfoAlert>{t("recovery.login.sent")}</InfoAlert>
      ) : (
        <SingleFieldForm
          label={t("idCommon.recoveryEmail")}
          kind="email"
          autoComplete="email"
          submitLabel={t("recovery.login.submit")}
          pending={mutation.isPending}
          error={mutation.error}
          onSubmit={(email) => mutation.mutate(email)}
        />
      )}
    </FlowCard>
  )
}
