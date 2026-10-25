"use client"

import { postTelegramOtpRequest } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { SingleFieldForm } from "../../shared/components/single-field-form"
import { useTr } from "../../shared/hooks/use-tr"

/** Passwordless OTP in the mini app, step 1: the login. The answer never says whether OTP is enabled (ID-13). */
type MiniAppOtpRequestProps = { initData: string; onSent: (login: string) => void; onBack: () => void }

export function MiniAppOtpRequest({ initData, onSent, onBack }: MiniAppOtpRequestProps) {
  const t = useTr()
  const mutation = useMutation({
    // A mini app has no Hydra login challenge: `initData` proves the caller instead.
    mutationFn: (login: string) => postTelegramOtpRequest({ init_data: initData, login }),
    onSuccess: (_result, login) => onSent(login),
  })
  return (
    <FlowCard title={t("loginOtp.title")} description={t("miniApp.otp.description")}>
      <SingleFieldForm
        label={t("login.login")}
        kind="text"
        autoComplete="username"
        submitLabel={t("loginOtp.sendCode")}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(login) => mutation.mutate(login)}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("loginOtp.backToPassword")}
      </Button>
    </FlowCard>
  )
}
