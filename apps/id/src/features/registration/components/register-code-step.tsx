"use client"

import { postRegisterComplete, postRegisterEmail, type RegisterCompleteResponse } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { CodeStep } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { StepIndicator } from "../../shared/components/step-indicator"
import { useTr } from "../../shared/hooks/use-tr"

type RegisterCodeStepProps = {
  registrationToken: string
  password: string
  email: string
  confirmImport: boolean
  loginChallenge: string | null
  onBack: () => void
  onCompleted: (response: RegisterCompleteResponse) => void
}

/** Step 3 (UF-ID-01 step 7): the OTP sent to the recovery email, then the account is created. */
export function RegisterCodeStep({
  registrationToken,
  password,
  email,
  confirmImport,
  loginChallenge,
  onBack,
  onCompleted,
}: RegisterCodeStepProps) {
  const t = useTr()
  const complete = useMutation({
    mutationFn: (code: string) =>
      postRegisterComplete({
        registration_token: registrationToken,
        password,
        email_code: code,
        confirm_import_match: confirmImport ? true : undefined,
        login_challenge: loginChallenge ?? undefined,
      }),
    onSuccess: onCompleted,
  })
  const resend = useMutation({ mutationFn: () => postRegisterEmail({ registration_token: registrationToken, email }) })

  return (
    <FlowCard title={t("register.code.title")} description={t("register.code.description", { email })}>
      <StepIndicator current={3} total={3} />
      <CodeStep
        submitLabel={t("register.code.submit")}
        pending={complete.isPending}
        error={complete.error ?? resend.error}
        onSubmit={(code) => complete.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("register.code.changeEmail")}
      </Button>
    </FlowCard>
  )
}
