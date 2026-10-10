"use client"

import { getIdMeQuery } from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageContainer,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { useUpdateMe } from "../hooks/use-update-me"
import { EmailCodeStep } from "./email-code-step"
import { EmailRequestForm, type EmailChangeValues } from "./email-request-form"

type Step = { kind: "form" } | { kind: "code"; values: EmailChangeValues } | { kind: "done" }

/** `/security/email/` (UF-ID-09, ID-25): current password plus a code sent to the new address. */
export function EmailChangePage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  const updateMe = useUpdateMe()
  const [step, setStep] = useState<Step>({ kind: "form" })

  return (
    <PageContainer title={t("security.email.title")}>
      <QueryBoundary query={me}>
        {(user) => (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("security.email.current", { email: user.recovery_email ?? t("security.cards.emailMissing") })}
              </CardTitle>
              <CardDescription>{t("security.email.hint")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {step.kind === "form" ? (
                <EmailRequestForm onSent={(values) => setStep({ kind: "code", values })} />
              ) : null}
              {step.kind === "code" ? (
                <EmailCodeStep
                  values={step.values}
                  onBack={() => setStep({ kind: "form" })}
                  onChanged={(updated) => {
                    updateMe(updated)
                    setStep({ kind: "done" })
                  }}
                />
              ) : null}
              {step.kind === "done" ? (
                <Alert role="status">
                  <AlertDescription>{t("security.email.done")}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}
