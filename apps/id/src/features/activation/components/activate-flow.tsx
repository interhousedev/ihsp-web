"use client"

import { getIdActivationQuery, isApiError } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FlowSkeleton } from "../../shared/components/flow-skeleton"
import { RequestFailed } from "../../shared/components/request-failed"
import { useTr } from "../../shared/hooks/use-tr"
import { redirectTo } from "../../shared/utils/redirect"
import { ActivationCodeStep } from "./activation-code-step"
import { ActivationForm } from "./activation-form"
import { ActivationInvalid } from "./activation-invalid"

type Step = { kind: "form" } | { kind: "code"; password: string; email: string }

/** The activation steps for one token: password and email, then the emailed code. */
export function ActivateFlow({ token }: { token: string }) {
  const t = useTr()
  const query = useQuery({
    ...getIdActivationQuery(token),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  const [step, setStep] = useState<Step>({ kind: "form" })

  if (query.isPending) return <FlowSkeleton />
  if (query.isError) {
    const status = isApiError(query.error) ? query.error.status : 0
    if (status >= 400 && status < 500) return <ActivationInvalid />
    return <RequestFailed title={t("activate.unavailable")} error={query.error} onRetry={() => void query.refetch()} />
  }
  if (step.kind === "code") {
    return (
      <ActivationCodeStep
        token={token}
        password={step.password}
        email={step.email}
        onBack={() => setStep({ kind: "form" })}
        // Administration accounts get OTP by email automatically when the email is confirmed (ID-11), so every
        // account continues straight to its app.
        onDone={redirectTo}
      />
    )
  }
  return <ActivationForm token={token} info={query.data} onSent={(values) => setStep({ kind: "code", ...values })} />
}
