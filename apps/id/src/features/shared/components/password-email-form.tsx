"use client"

import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, type ReactNode } from "react"
import { z } from "zod"
import { useTr } from "../hooks/use-tr"
import { emailText, mismatchIssue, newPasswordText, passwordsMatch } from "../utils/schemas"
import { ErrorAlert } from "./error-alert"
import { PasswordRules } from "./password-rules"

export type PasswordEmailValues = { password: string; email: string; confirmed: boolean }

type PasswordEmailFormProps = {
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (values: PasswordEmailValues) => void
  /** A checkbox that must be ticked before submitting (the "Is this you?" confirmation of an imported record). */
  confirmation?: { label: string; required: boolean }
  children?: ReactNode
}

/** New password (live rules), its confirmation and the recovery email: registration, reclaim and activation. */
export function PasswordEmailForm({
  submitLabel,
  pending,
  error,
  onSubmit,
  confirmation,
  children,
}: PasswordEmailFormProps) {
  const t = useTr()
  const mustConfirm = confirmation?.required === true
  const schema = useMemo(
    () =>
      z
        .object({
          password: newPasswordText(t),
          confirm: z.string(),
          email: emailText(t),
          confirmed: z.boolean(),
        })
        .refine(passwordsMatch, mismatchIssue(t))
        .refine((value) => !mustConfirm || value.confirmed, {
          path: ["confirmed"],
          message: t("idCommon.validation.confirmRequired"),
        }),
    [t, mustConfirm],
  )
  const form = useAppForm({
    defaultValues: { password: "", confirm: "", email: "", confirmed: false },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      onSubmit({ password: value.password, email: value.email.trim(), confirmed: value.confirmed }),
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
      {children}
      {confirmation ? (
        <form.AppField name="confirmed">{(field) => <field.CheckboxField label={confirmation.label} />}</form.AppField>
      ) : null}
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
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={t("idCommon.recoveryEmail")}
            description={t("idCommon.recoveryEmailHint")}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            className="h-11 text-base"
          />
        )}
      </form.AppField>
      <ErrorAlert error={error} />
      <LoadingButton type="submit" className="h-11 text-base" loading={pending} loadingLabel={t("idCommon.working")}>
        {submitLabel}
      </LoadingButton>
    </form>
  )
}
