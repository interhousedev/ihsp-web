"use client"

import { postLogin, type LoginInfo } from "@ihsp/api"
import { LoadingButton, Separator, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed, withChallenge } from "../../shared/utils/challenge"
import { isTouchDevice } from "../../shared/utils/is-touch-device"
import { requiredText } from "../../shared/utils/schemas"
import { applyLoginResult, type SecondFactor } from "../utils/login-result"
import { LoginError } from "./login-error"
import { LoginLinks } from "./login-links"

export type PasswordCredentials = { login: string; password: string; remember: boolean }

type PasswordLoginFormProps = {
  challenge: string
  info: LoginInfo
  onSecondFactor: (credentials: PasswordCredentials, factor: SecondFactor) => void
  /** The password was set by an administrator and must be replaced; the ticket finishes the login. */
  onPasswordChange: (ticket: string) => void
}

/** UF-ID-02: login and password. **Log in with OTP** is always shown (ID-13), so it never reveals who has OTP. */
export function PasswordLoginForm({ challenge, info, onSecondFactor, onPasswordChange }: PasswordLoginFormProps) {
  const t = useTr()
  const schema = useMemo(
    () =>
      z.object({
        login: requiredText(t),
        password: z.string().min(1, t("idCommon.validation.required")),
        remember: z.boolean(),
      }),
    [t],
  )
  const mutation = useMutation({
    mutationFn: (value: PasswordCredentials) =>
      postLogin({
        login_challenge: challenge,
        login: value.login.trim(),
        password: value.password,
        remember: value.remember,
      }),
    onSuccess: (result, value) => applyLoginResult(result, (factor) => onSecondFactor(value, factor), onPasswordChange),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const form = useAppForm({
    defaultValues: { login: "", password: "", remember: false } as PasswordCredentials,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => undefined)
    },
  })

  return (
    <FlowCard
      title={t("login.title")}
      description={
        info.client_name ? t("login.description", { client: info.client_name }) : t("login.descriptionPending")
      }
      footer={<LoginLinks challenge={challenge} />}
    >
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="login">
          {(field) => (
            <field.TextField
              label={t("login.login")}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={!isTouchDevice()}
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t("login.password")}
              type="password"
              autoComplete="current-password"
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <form.AppField name="remember">{(field) => <field.CheckboxField label={t("login.remember")} />}</form.AppField>
        <LoginError error={mutation.error} clientId={info.client_id} />
        <LoadingButton
          type="submit"
          className="h-11 text-base"
          loading={mutation.isPending}
          loadingLabel={t("idCommon.working")}
        >
          {t("login.submit")}
        </LoadingButton>
      </form>
      <Separator />
      <LinkButton href={withChallenge("/login/otp/", "login_challenge", challenge)} variant="outline">
        {t("login.withOtp")}
      </LinkButton>
    </FlowCard>
  )
}
