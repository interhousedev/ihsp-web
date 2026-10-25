"use client"

import { postIdMeEmailChange } from "@ihsp/api"
import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"
import { emailText } from "../../shared/utils/schemas"

export type EmailChangeValues = { password: string; email: string }

/** UF-ID-09 steps 1-2: the current password and the new address; the code goes to the new address. */
export function EmailRequestForm({ onSent }: { onSent: (values: EmailChangeValues) => void }) {
  const t = useTr()
  const schema = useMemo(
    () => z.object({ password: z.string().min(1, t("idCommon.validation.required")), email: emailText(t) }),
    [t],
  )
  const mutation = useMutation({
    mutationFn: (values: EmailChangeValues) =>
      postIdMeEmailChange({ password: values.password, new_email: values.email }),
    onSuccess: (_result, values) => onSent(values),
  })
  const form = useAppForm({
    defaultValues: { password: "", email: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ password: value.password, email: value.email.trim() }).catch(() => undefined)
    },
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
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            label={t("security.currentPassword")}
            type="password"
            autoComplete="current-password"
            className="h-11 text-base"
          />
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={t("security.email.new")}
            type="email"
            inputMode="email"
            autoComplete="email"
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
        {t("security.email.send")}
      </LoadingButton>
    </form>
  )
}
