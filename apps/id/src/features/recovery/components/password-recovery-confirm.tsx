"use client"

import { postIdRecoveryPasswordConfirm, postIdRecoveryPasswordRequest } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { RESEND_SECONDS } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { useCountdown } from "../../shared/hooks/use-countdown"
import { useTr } from "../../shared/hooks/use-tr"
import { PasswordResetForm } from "./password-reset-form"

type PasswordRecoveryConfirmProps = { identifier: string; onDone: () => void }

/** Step 2 of the password reset: the emailed code and the new password. */
export function PasswordRecoveryConfirm({ identifier, onDone }: PasswordRecoveryConfirmProps) {
  const t = useTr()
  const { left, restart } = useCountdown(RESEND_SECONDS)
  const confirm = useMutation({
    mutationFn: (values: { code: string; password: string }) =>
      postIdRecoveryPasswordConfirm({ login_or_email: identifier, code: values.code, new_password: values.password }),
    onSuccess: onDone,
  })
  const resend = useMutation({
    mutationFn: () => postIdRecoveryPasswordRequest({ login_or_email: identifier }),
    onSuccess: restart,
  })
  return (
    <FlowCard title={t("recovery.password.confirmTitle")} description={t("recovery.password.neutral")}>
      <PasswordResetForm
        pending={confirm.isPending}
        error={confirm.error ?? resend.error}
        onSubmit={(values) => confirm.mutate(values)}
        resend={
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={left > 0 || resend.isPending}
            onClick={() => resend.mutate()}
          >
            {left > 0 ? t("idCommon.resendIn", { seconds: left }) : t("idCommon.resend")}
          </Button>
        }
      />
    </FlowCard>
  )
}
