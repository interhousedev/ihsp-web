"use client"

import { postIdMeEmailChange, postIdMeEmailChangeConfirm, type UserMe } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { CodeStep } from "../../shared/components/code-step"
import { useTr } from "../../shared/hooks/use-tr"
import type { EmailChangeValues } from "./email-request-form"

type EmailCodeStepProps = { values: EmailChangeValues; onBack: () => void; onChanged: (user: UserMe) => void }

/** UF-ID-09 step 2: the code sent to the new address confirms the change. */
export function EmailCodeStep({ values, onBack, onChanged }: EmailCodeStepProps) {
  const t = useTr()
  const confirm = useMutation({
    mutationFn: (code: string) => postIdMeEmailChangeConfirm({ code }),
    onSuccess: onChanged,
  })
  const resend = useMutation({
    mutationFn: () => postIdMeEmailChange({ password: values.password, new_email: values.email }),
  })
  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">{t("security.email.codeSent", { email: values.email })}</p>
      <CodeStep
        submitLabel={t("security.email.confirm")}
        pending={confirm.isPending}
        error={confirm.error ?? resend.error}
        onSubmit={(code) => confirm.mutate(code)}
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("register.code.changeEmail")}
      </Button>
    </div>
  )
}
