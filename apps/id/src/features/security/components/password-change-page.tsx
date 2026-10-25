"use client"

import { postPassword } from "@ihsp/api"
import { Alert, AlertDescription, Card, CardContent, LoadingButton, PageContainer, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { PasswordRules } from "../../shared/components/password-rules"
import { useTr } from "../../shared/hooks/use-tr"
import { mismatchIssue, newPasswordText, passwordsMatch } from "../../shared/utils/schemas"

/** `/security/password/`: change the password; the backend signs out the other sessions. */
export function PasswordChangePage() {
  const t = useTr()
  const schema = useMemo(
    () =>
      z
        .object({
          current: z.string().min(1, t("idCommon.validation.required")),
          password: newPasswordText(t),
          confirm: z.string(),
        })
        .refine(passwordsMatch, mismatchIssue(t)),
    [t],
  )
  const mutation = useMutation({
    mutationFn: (values: { current: string; password: string }) =>
      postPassword({ current_password: values.current, new_password: values.password }),
  })
  const form = useAppForm({
    defaultValues: { current: "", password: "", confirm: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      const done = await mutation.mutateAsync({ current: value.current, password: value.password }).then(
        () => true,
        () => false,
      )
      if (done) formApi.reset()
    },
  })

  return (
    <PageContainer title={t("security.password.title")} description={t("security.password.description")}>
      <Card>
        <CardContent>
          <form
            noValidate
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              mutation.reset()
              void form.handleSubmit()
            }}
          >
            <form.AppField name="current">
              {(field) => (
                <field.TextField
                  label={t("security.currentPassword")}
                  type="password"
                  autoComplete="current-password"
                  className="h-11 text-base"
                />
              )}
            </form.AppField>
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
            {mutation.isSuccess ? (
              <Alert role="status">
                <AlertDescription>{t("security.password.done")}</AlertDescription>
              </Alert>
            ) : null}
            <LoadingButton
              type="submit"
              className="h-11 text-base"
              loading={mutation.isPending}
              loadingLabel={t("idCommon.working")}
            >
              {t("security.password.submit")}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
