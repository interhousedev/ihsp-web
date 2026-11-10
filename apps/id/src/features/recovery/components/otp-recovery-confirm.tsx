"use client"

import { postIdRecoveryOtpConfirm, postIdRecoveryOtpRequest } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { CodeStep, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "../../shared/components/flow-card"

type OtpRecoveryConfirmProps = { login: string; onDone: (effectiveAt: string) => void }

/** Step 2 of the OTP reset: the emailed code schedules the reset. */
export function OtpRecoveryConfirm({ login, onDone }: OtpRecoveryConfirmProps) {
  const t = useTr()
  const confirm = useMutation({
    mutationFn: (code: string) => postIdRecoveryOtpConfirm({ login, code }),
    onSuccess: (result) => onDone(result.effective_at),
  })
  const resend = useMutation({ mutationFn: () => postIdRecoveryOtpRequest({ login }) })
  return (
    <FlowCard title={t("recovery.otp.confirmTitle")} description={t("recovery.otp.neutral")}>
      <CodeStep
        submitLabel={t("recovery.otp.confirm")}
        pending={confirm.isPending}
        error={confirm.error ?? resend.error}
        onSubmit={(code) => confirm.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
    </FlowCard>
  )
}
