"use client"

import { Button, LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { z } from "zod"
import { useTr } from "../hooks/use-tr"
import { codeText } from "../utils/schemas"
import { ErrorAlert } from "./error-alert"

type TotpCodeFormProps = {
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (code: string) => void
  /** Allow a one-time recovery code instead of the app's 6-digit code. */
  allowRecovery?: boolean
  destructive?: boolean
}

/** The authenticator app's 6-digit code, or (switchable) a recovery code such as `k7mqa-2xpab`. */
export function TotpCodeForm({
  submitLabel,
  pending,
  error,
  onSubmit,
  allowRecovery = true,
  destructive = false,
}: TotpCodeFormProps) {
  const t = useTr()
  const [recovery, setRecovery] = useState(false)
  const schema = useMemo(
    () =>
      z.object({
        code: recovery
          ? z
              .string()
              .trim()
              .regex(/^[a-z0-9]{5}-?[a-z0-9]{5}$/i, t("idCommon.validation.recoveryCode"))
          : codeText(t),
      }),
    [recovery, t],
  )
  const form = useAppForm({
    defaultValues: { code: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value.code.trim()),
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
      <form.AppField name="code">
        {(field) =>
          recovery ? (
            <field.TextField
              label={t("idCommon.recoveryCode")}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-11 font-mono text-base"
            />
          ) : (
            <field.OtpField label={t("idCommon.appCode")} />
          )
        }
      </form.AppField>
      <ErrorAlert error={error} />
      <LoadingButton
        type="submit"
        variant={destructive ? "destructive" : "default"}
        className="h-11 text-base"
        loading={pending}
        loadingLabel={t("idCommon.working")}
      >
        {submitLabel}
      </LoadingButton>
      {allowRecovery ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => {
            form.reset()
            setRecovery((value) => !value)
          }}
        >
          {recovery ? t("idCommon.useAppCode") : t("idCommon.useRecoveryCode")}
        </Button>
      ) : null}
    </form>
  )
}
