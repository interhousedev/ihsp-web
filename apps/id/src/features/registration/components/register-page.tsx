"use client"

import { postRegisterEmis, type LoginCueGroup, type LoginCueName, type RegistrationStart } from "@ihsp/api"
import { isMiniApp } from "@ihsp/telegram"
import { Button } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { EMIS_LOGIN_PARAM } from "../../login/utils/emis-login"
import { TextLink } from "../../shared/components/text-link"
import { useQueryParam } from "../../shared/hooks/use-query-param"
import { useTr } from "../../shared/hooks/use-tr"
import { withChallenge } from "../../shared/utils/challenge"
import { signInWithTicket } from "../../shared/utils/login-ticket"
import { redirectTo } from "../../shared/utils/redirect"
import { TELEGRAM_NEW_LOGIN_KEY, writeSession } from "../../shared/utils/storage"
import { EmisCredentialsForm } from "./emis-credentials-form"
import { RegisterCodeStep } from "./register-code-step"
import { RegisterCueGroupStep } from "./register-cue-group-step"
import { RegisterCueNameStep } from "./register-cue-name-step"
import { RegisterCuePasswordStep } from "./register-cue-password-step"
import { RegisterDone } from "./register-done"
import { RegisterProfileStep } from "./register-profile-step"
import { RegisterWelcome } from "./register-welcome"

type Step =
  | { kind: "emis" }
  | { kind: "cue-group" }
  | { kind: "cue-name"; group: LoginCueGroup }
  | { kind: "cue-password"; group: LoginCueGroup; cue: LoginCueName }
  | { kind: "profile"; start: RegistrationStart; fromCue: boolean }
  | {
      kind: "code"
      start: RegistrationStart
      password: string
      email: string
      confirmImport: boolean
      fromCue: boolean
    }
  | { kind: "welcome"; login: string; redirectTo: string | null; ticket: string | null }
  | { kind: "done"; login: string }

type AfterRegistration = { login: string; redirectTo: string | null; ticket: string | null }

/**
 * Follows a finished registration: a Hydra `redirect_to` or a login ticket wins; otherwise `showDone` runs.
 * Inside the Telegram web UI (`isMiniApp`) the caller passes my.iht, so the welcome screen is never shown there.
 */
function continueRegistration(after: AfterRegistration, showDone: () => void): void {
  if (after.redirectTo) redirectTo(after.redirectTo)
  else if (after.ticket) signInWithTicket(after.ticket)
  else showDone()
}

/** `/register/`: three steps of the EMIS registration (UF-ID-01). Carries `login_challenge` when it comes from a login. */
export function RegisterPage() {
  const t = useTr()
  const loginChallenge = useQueryParam("login_challenge")
  // Set when the IHT ID login page sent an all-digit (EMIS-style) login here; the password is never carried over.
  const emisLogin = useQueryParam(EMIS_LOGIN_PARAM)
  const [step, setStep] = useState<Step>({ kind: "emis" })
  const start = useMutation({
    mutationFn: (values: { emis_login: string; emis_password: string }) => postRegisterEmis(values),
    onSuccess: (result) => setStep({ kind: "profile", start: result, fromCue: false }),
  })

  if (step.kind === "cue-group") {
    return (
      <RegisterCueGroupStep
        onPicked={(group) => setStep({ kind: "cue-name", group })}
        onBack={() => setStep({ kind: "emis" })}
      />
    )
  }
  if (step.kind === "cue-name") {
    return (
      <RegisterCueNameStep
        group={step.group}
        onPicked={(cue) => setStep({ kind: "cue-password", group: step.group, cue })}
        onBack={() => setStep({ kind: "cue-group" })}
      />
    )
  }
  if (step.kind === "cue-password") {
    return (
      <RegisterCuePasswordStep
        cue={step.cue}
        onStarted={(result) => setStep({ kind: "profile", start: result, fromCue: true })}
        onBack={() => setStep({ kind: "cue-name", group: step.group })}
      />
    )
  }
  if (step.kind === "profile") {
    return (
      <RegisterProfileStep
        start={step.start}
        hideLogin={step.fromCue}
        onSent={(values) =>
          setStep({
            kind: "code",
            start: step.start,
            fromCue: step.fromCue,
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
        onBack={() => setStep({ kind: "profile", start: step.start, fromCue: step.fromCue })}
        onCompleted={(response) => {
          const after: AfterRegistration = {
            login: response.login,
            redirectTo: response.redirect_to ?? null,
            ticket: response.login_ticket ?? null,
          }
          if (isMiniApp()) {
            // Back to the mini app login page, which links this Telegram account to the new login and then opens my.iht.
            continueRegistration(after, () => {
              writeSession(TELEGRAM_NEW_LOGIN_KEY, response.login)
              redirectTo("/telegram/")
            })
          } else {
            setStep({ kind: "welcome", ...after })
          }
        }}
      />
    )
  }
  if (step.kind === "welcome") {
    const after: AfterRegistration = { login: step.login, redirectTo: step.redirectTo, ticket: step.ticket }
    const onContinue = () => continueRegistration(after, () => setStep({ kind: "done", login: step.login }))
    return <RegisterWelcome onContinue={onContinue} />
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
      initialLogin={emisLogin ?? ""}
      notice={emisLogin ? t("register.emisLoginNotice") : undefined}
      footer={
        <>
          <Button
            type="button"
            variant="link"
            className="h-11 text-base"
            onClick={() => setStep({ kind: "cue-group" })}
          >
            {t("register.pickLink")}
          </Button>
          <TextLink href={loginChallenge ? withChallenge("/login/", "login_challenge", loginChallenge) : "/security/"}>
            {t("register.haveAccount")}
          </TextLink>
        </>
      }
    />
  )
}
