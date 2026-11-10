"use client"

import { Button, LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, type ReactNode } from "react"
import { z } from "zod"
import { useCountdown } from "../hooks/use-countdown"
import { useTr } from "../hooks/use-tr"
import { codeText } from "../utils/schemas"
import { ErrorAlert } from "./error-alert"

/** ID-14: a new code can be requested after 60 seconds. */
export const RESEND_SECONDS = 60

type CodeStepProps = {
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (code: string) => void
  /** Shows **Send new code**, available after the cooldown. */
  onResend?: () => void
  resendPending?: boolean
  /** The code is spent (three wrong attempts): only **Send new code** works. */
  disabled?: boolean
  children?: ReactNode
}

/** One 6-digit code field with submit and the resend cooldown; shared by every flow that confirms an OTP. */
export function CodeStep({
  submitLabel,
  pending,
  error,
  onSubmit,
  onResend,
  resendPending,
  disabled,
  children,
}: CodeStepProps) {
  const t = useTr()
  const schema = useMemo(() => z.object({ code: codeText(t) }), [t])
  const { left, restart } = useCountdown(RESEND_SECONDS)
  const form = useAppForm({
    defaultValues: { code: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value.code),
  })

  function resend() {
    form.reset()
    restart()
    onResend?.()
  }

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
      <form.AppField name="code">{(field) => <field.OtpField label={t("idCommon.code")} />}</form.AppField>
      <ErrorAlert error={error} />
      <LoadingButton
        type="submit"
        className="h-11 text-base"
        loading={pending}
        loadingLabel={t("idCommon.working")}
        disabled={disabled}
      >
        {submitLabel}
      </LoadingButton>
      {onResend ? (
        <Button type="button" variant="ghost" className="h-11" disabled={left > 0 || resendPending} onClick={resend}>
          {left > 0 ? t("idCommon.resendIn", { seconds: left }) : t("idCommon.resend")}
        </Button>
      ) : null}
    </form>
  )
}
