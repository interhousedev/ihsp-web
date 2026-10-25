"use client"

import { postLoginPassword } from "@ihsp/api"
import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { PasswordRules } from "../../shared/components/password-rules"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed } from "../../shared/utils/challenge"
import { mismatchIssue, newPasswordText, passwordsMatch } from "../../shared/utils/schemas"
import { applyLoginResult } from "../utils/login-result"

type NewPasswordFormProps = { challenge: string; ticket: string }

/** The step after a correct password that an administrator set (feature `change_password_on_login`): choose your own. */
export function NewPasswordForm({ challenge, ticket }: NewPasswordFormProps) {
  const t = useTr()
  const schema = useMemo(
    () => z.object({ password: newPasswordText(t), confirm: z.string() }).refine(passwordsMatch, mismatchIssue(t)),
    [t],
  )
  const mutation = useMutation({
    mutationFn: (password: string) => postLoginPassword({ login_challenge: challenge, ticket, new_password: password }),
    onSuccess: (result) => applyLoginResult(result, () => undefined),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const form = useAppForm({
    defaultValues: { password: "", confirm: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value.password).catch(() => undefined)
    },
  })

  return (
    <FlowCard title={t("login.passwordChange.title")} description={t("login.passwordChange.description")}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutation.reset()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t("idCommon.newPassword")}
              type="password"
              autoComplete="new-password"
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.password}>
          {(password) => <PasswordRules password={password} />}
        </form.Subscribe>
        <form.AppField name="confirm">
          {(field) => (
            <field.TextField
              label={t("idCommon.confirmPassword")}
              type="password"
              autoComplete="new-password"
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <ErrorAlert error={mutation.error} />
        <LoadingButton
          type="submit"
          className="h-11 text-base"
          loading={mutation.isPending}
          loadingLabel={t("idCommon.working")}
        >
          {t("login.passwordChange.submit")}
        </LoadingButton>
      </form>
    </FlowCard>
  )
}
