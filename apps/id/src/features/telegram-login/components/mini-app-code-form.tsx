"use client"

import { postTelegramLogin, postTelegramOtpRequest } from "@ihsp/api"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { CodeStep } from "../../shared/components/code-step"
import { FlowCard } from "../../shared/components/flow-card"
import { InfoAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"
import { useTelegramLogin } from "../hooks/use-telegram-login"

type MiniAppCodeFormProps = {
  initData: string
  login: string
  /** Set after a correct password (Administration second factor); empty for the passwordless OTP login. */
  password: string | null
  onLinked: (login: string) => void
  onBack: () => void
}

/** The code step of the mini app: a second factor after the password, or the passwordless OTP login. */
export function MiniAppCodeForm({ initData, login, password, onLinked, onBack }: MiniAppCodeFormProps) {
  const t = useTr()
  const mutation = useTelegramLogin(initData, { onLinked })
  // The login challenge belongs to the browser flow; a mini app proves the caller with `initData` instead.
  const resend = useMutation({
    mutationFn: async () => {
      if (password === null) await postTelegramOtpRequest({ init_data: initData, login })
      else await postTelegramLogin({ init_data: initData, login, password })
    },
  })

  return (
    <FlowCard title={t("miniApp.code.title")} description={t("miniApp.code.description")}>
      <InfoAlert>{t("loginOtp.neutral")}</InfoAlert>
      <CodeStep
        submitLabel={t("miniApp.code.submit")}
        pending={mutation.isPending}
        error={mutation.error ?? resend.error}
        onSubmit={(code) =>
          mutation.mutate(password === null ? { login, otp_code: code } : { login, password, otp_code: code })
        }
        onResend={() => resend.mutate()}
        resendPending={resend.isPending}
      />
      <Button type="button" variant="ghost" className="h-11" onClick={onBack}>
        {t("miniApp.code.back")}
      </Button>
    </FlowCard>
  )
}
