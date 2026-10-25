"use client"

import { postReclaimEmis, type ReclaimStart } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { EmisCredentialsForm } from "../../registration/components/emis-credentials-form"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"
import { ReclaimCodeStep } from "./reclaim-code-step"
import { ReclaimDone } from "./reclaim-done"
import { ReclaimPasswordStep } from "./reclaim-password-step"

type Step =
  | { kind: "emis" }
  | { kind: "password"; start: ReclaimStart }
  | { kind: "code"; start: ReclaimStart; password: string; email: string }
  | { kind: "done" }

/** `/reclaim/`: take an account back with the EMIS credentials (UF-ID-15, ID-28). */
export function ReclaimPage() {
  const t = useTr()
  const [step, setStep] = useState<Step>({ kind: "emis" })
  const emis = useMutation({
    mutationFn: (values: { emis_login: string; emis_password: string }) => postReclaimEmis(values),
    onSuccess: (start) => setStep({ kind: "password", start }),
  })

  if (step.kind === "password") {
    return (
      <ReclaimPasswordStep
        start={step.start}
        onSent={(values) => setStep({ kind: "code", start: step.start, ...values })}
      />
    )
  }
  if (step.kind === "code") {
    return (
      <ReclaimCodeStep
        start={step.start}
        password={step.password}
        email={step.email}
        onBack={() => setStep({ kind: "password", start: step.start })}
        onDone={() => setStep({ kind: "done" })}
      />
    )
  }
  if (step.kind === "done") return <ReclaimDone />
  return (
    <EmisCredentialsForm
      title={t("reclaim.title")}
      description={t("reclaim.description")}
      submitLabel={t("reclaim.submit")}
      pending={emis.isPending}
      error={emis.error}
      onSubmit={(values) => emis.mutate(values)}
      footer={<TextLink href="/security/">{t("reclaim.backToLogin")}</TextLink>}
    />
  )
}
