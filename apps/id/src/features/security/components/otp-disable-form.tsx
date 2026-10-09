"use client"

import { postOtpDisable, type UserMe } from "@ihsp/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingButton,
  useAppForm,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

type OtpDisableFormProps = { onDisabled: (user: UserMe) => void }

/** UF-ID-06 1a: turning OTP off needs the password (OTP is optional for everyone, Administration included). */
export function OtpDisableForm({ onDisabled }: OtpDisableFormProps) {
  const t = useTr()
  const schema = useMemo(() => z.object({ password: z.string().min(1, t("idCommon.validation.required")) }), [t])
  const mutation = useMutation({
    mutationFn: (password: string) => postOtpDisable({ password }),
    onSuccess: onDisabled,
  })
  const form = useAppForm({
    defaultValues: { password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value.password).catch(() => undefined)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.otp.disableTitle")}</CardTitle>
        <CardDescription>{t("security.otp.disableDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
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
          <ErrorAlert error={mutation.error} />
          <LoadingButton
            type="submit"
            variant="destructive"
            className="h-11 text-base"
            loading={mutation.isPending}
            loadingLabel={t("idCommon.working")}
          >
            {t("security.otp.disable")}
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}
