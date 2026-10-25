"use client"

import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, type ReactNode } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { PasswordRules } from "../../shared/components/password-rules"
import { useTr } from "../../shared/hooks/use-tr"
import { codeText, mismatchIssue, newPasswordText, passwordsMatch } from "../../shared/utils/schemas"

type PasswordResetFormProps = {
  pending: boolean
  error: unknown
  onSubmit: (values: { code: string; password: string }) => void
  /** Sends a new code when the cooldown ended. */
  resend?: ReactNode
}

/** The code from the email plus the new password (UF-ID-07 step 3). */
export function PasswordResetForm({ pending, error, onSubmit, resend }: PasswordResetFormProps) {
  const t = useTr()
  const schema = useMemo(
    () =>
      z
        .object({ code: codeText(t), password: newPasswordText(t), confirm: z.string() })
        .refine(passwordsMatch, mismatchIssue(t)),
    [t],
  )
  const form = useAppForm({
    defaultValues: { code: "", password: "", confirm: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit({ code: value.code, password: value.password }),
  })
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="code">{(field) => <field.OtpField label={t("idCommon.code")} />}</form.AppField>
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
      <ErrorAlert error={error} />
      <LoadingButton type="submit" className="h-11 text-base" loading={pending} loadingLabel={t("idCommon.working")}>
        {t("recovery.password.submit")}
      </LoadingButton>
      {resend}
    </form>
  )
}
