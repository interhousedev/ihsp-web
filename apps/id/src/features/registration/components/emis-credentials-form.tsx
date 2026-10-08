"use client"

import { isApiError } from "@ihsp/api"
import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, type ReactNode } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"
import { withChallenge } from "../../shared/utils/challenge"
import { requiredText } from "../../shared/utils/schemas"

type EmisCredentialsFormProps = {
  title: string
  description: string
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (values: { emis_login: string; emis_password: string }) => void
  /** Registration only: offers log in / reset / reclaim when the EMIS account already has an IHSP account. */
  loginChallenge?: string | null
  withLinkedActions?: boolean
  footer?: ReactNode
}

/** Step 1 of registration and reclaim: the EMIS login and password (ID-1, ID-28). */
export function EmisCredentialsForm({
  title,
  description,
  submitLabel,
  pending,
  error,
  onSubmit,
  loginChallenge = null,
  withLinkedActions = false,
  footer,
}: EmisCredentialsFormProps) {
  const t = useTr()
  const schema = useMemo(
    () =>
      z.object({ emis_login: requiredText(t), emis_password: z.string().min(1, t("idCommon.validation.required")) }),
    [t],
  )
  const form = useAppForm({
    defaultValues: { emis_login: "", emis_password: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit({ emis_login: value.emis_login.trim(), emis_password: value.emis_password }),
  })
  const alreadyLinked = withLinkedActions && isApiError(error) && error.type === "id/emis-already-linked"

  return (
    <FlowCard title={title} description={description} footer={footer}>
      <StepIndicator current={1} total={3} />
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="emis_login">
          {(field) => (
            <field.TextField
              label={t("idCommon.emisLogin")}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <form.AppField name="emis_password">
          {(field) => (
            <field.TextField
              label={t("idCommon.emisPassword")}
              description={t("idCommon.emisPasswordHint")}
              type="password"
              autoComplete="off"
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <ErrorAlert error={error} />
        {alreadyLinked ? (
          <div className="grid gap-2">
            <LinkButton
              href={loginChallenge ? withChallenge("/login/", "login_challenge", loginChallenge) : "/security/"}
              variant="outline"
            >
              {t("register.linked.login")}
            </LinkButton>
            <LinkButton href="/recovery/password/" variant="outline">
              {t("register.linked.reset")}
            </LinkButton>
            <LinkButton href="/reclaim/" variant="outline">
              {t("register.linked.reclaim")}
            </LinkButton>
          </div>
        ) : null}
        <LoadingButton type="submit" className="h-11 text-base" loading={pending} loadingLabel={t("idCommon.working")}>
          {submitLabel}
        </LoadingButton>
      </form>
    </FlowCard>
  )
}
