"use client"

import { isApiError, keys, postTelegramStatus } from "@ihsp/api"
import { expand } from "@ihsp/telegram"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { MiniAppCodeForm } from "./mini-app-code-form"
import { MiniAppLinked } from "./mini-app-linked"
import { MiniAppOtpRequest } from "./mini-app-otp-request"
import { MiniAppPasswordForm } from "./mini-app-password-form"
import { MiniAppSessionExpired } from "./mini-app-session-expired"

type Step =
  | { kind: "password" }
  | { kind: "second-factor"; login: string; password: string }
  | { kind: "otp-request" }
  | { kind: "otp-code"; login: string }
  | { kind: "linked"; login: string }

/** The signed-in-or-not decision of the mini app: already linked, expired `initData`, or the login form. */
export function MiniAppLogin({ initData }: { initData: string }) {
  const t = useTr()
  const [step, setStep] = useState<Step>({ kind: "password" })
  const status = useQuery({
    queryKey: [...keys.id.all(), "telegram-status", initData],
    queryFn: () => postTelegramStatus({ init_data: initData }),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    expand()
  }, [])

  if (status.isPending) return <FlowSkeleton />
  if (status.isError) {
    if (isApiError(status.error) && status.error.status === 401) return <MiniAppSessionExpired />
    return <RequestFailed title={t("miniApp.unavailable")} error={status.error} onRetry={() => void status.refetch()} />
  }
  if (status.data.linked) return <MiniAppLinked login={status.data.login ?? ""} />

  const linked = (login: string) => setStep({ kind: "linked", login })
  if (step.kind === "linked") return <MiniAppLinked login={step.login} />
  if (step.kind === "second-factor") {
    return (
      <MiniAppCodeForm
        initData={initData}
        login={step.login}
        password={step.password}
        onLinked={linked}
        onBack={() => setStep({ kind: "password" })}
      />
    )
  }
  if (step.kind === "otp-request") {
    return (
      <MiniAppOtpRequest
        initData={initData}
        onSent={(login) => setStep({ kind: "otp-code", login })}
        onBack={() => setStep({ kind: "password" })}
      />
    )
  }
  if (step.kind === "otp-code") {
    return (
      <MiniAppCodeForm
        initData={initData}
        login={step.login}
        password={null}
        onLinked={linked}
        onBack={() => setStep({ kind: "otp-request" })}
      />
    )
  }
  return (
    <MiniAppPasswordForm
      initData={initData}
      onLinked={linked}
      onSecondFactor={(credentials) => setStep({ kind: "second-factor", ...credentials })}
      onOtp={() => setStep({ kind: "otp-request" })}
    />
  )
}
