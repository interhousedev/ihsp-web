"use client"

import { postRegisterEmis, type RegistrationStart } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { TextLink } from "../../shared/components/text-link"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { useTr } from "../../shared/hooks/use-tr"
import { withChallenge } from "../../shared/utils/challenge"
import { redirectTo } from "../../shared/utils/redirect"
import { EmisCredentialsForm } from "./emis-credentials-form"
import { RegisterCodeStep } from "./register-code-step"
import { RegisterDone } from "./register-done"
import { RegisterProfileStep } from "./register-profile-step"
import { RegisterWelcome } from "./register-welcome"

type Step =
  | { kind: "emis" }
  | { kind: "profile"; start: RegistrationStart }
  | { kind: "code"; start: RegistrationStart; password: string; email: string; confirmImport: boolean }
  | { kind: "welcome"; login: string; redirectTo: string | null }
  | { kind: "done"; login: string }

/** `/register/`: three steps of the EMIS registration (UF-ID-01). Carries `login_challenge` when it comes from a login. */
export function RegisterPage() {
  const t = useTr()
  const loginChallenge = useQueryParam("login_challenge")
  const [step, setStep] = useState<Step>({ kind: "emis" })
  const start = useMutation({
    mutationFn: (values: { emis_login: string; emis_password: string }) => postRegisterEmis(values),
    onSuccess: (result) => setStep({ kind: "profile", start: result }),
  })

  if (step.kind === "profile") {
    return (
      <RegisterProfileStep
        start={step.start}
        onSent={(values) =>
          setStep({
            kind: "code",
            start: step.start,
            password: values.password,
            email: values.email,
            confirmImport: values.confirmed,
          })
        }
      />
    )
  }
  if (step.kind === "code") {
    return (
      <RegisterCodeStep
        registrationToken={step.start.registration_token}
        password={step.password}
        email={step.email}
        confirmImport={step.confirmImport}
        loginChallenge={loginChallenge}
        onBack={() => setStep({ kind: "profile", start: step.start })}
        onCompleted={(response) =>
          setStep({ kind: "welcome", login: response.login, redirectTo: response.redirect_to ?? null })
        }
      />
    )
  }
  if (step.kind === "welcome") {
    const { login, redirectTo: next } = step
    return <RegisterWelcome onContinue={() => (next ? redirectTo(next) : setStep({ kind: "done", login }))} />
  }
  if (step.kind === "done") return <RegisterDone login={step.login} />
  return (
    <EmisCredentialsForm
      title={t("register.title")}
      description={t("register.description")}
      submitLabel={t("register.submit")}
      pending={start.isPending}
      error={start.error}
      onSubmit={(values) => start.mutate(values)}
      loginChallenge={loginChallenge}
      withLinkedActions
      footer={
        <TextLink href={loginChallenge ? withChallenge("/login/", "login_challenge", loginChallenge) : "/security/"}>
          {t("register.haveAccount")}
        </TextLink>
      }
    />
  )
}
