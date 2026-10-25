"use client"

import { postLoginOtpRequest } from "@ihsp/api"
import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"
import { followChallengeUsed, withChallenge } from "../../shared/utils/challenge"
import { isTouchDevice } from "../../shared/utils/is-touch-device"
import { requiredText } from "../../shared/utils/schemas"

type OtpRequestFormProps = { challenge: string; clientName: string; onSent: (login: string) => void }

/** UF-ID-03 step 1: the login; the answer is the same whether or not OTP is enabled for it (ID-13). */
export function OtpRequestForm({ challenge, clientName, onSent }: OtpRequestFormProps) {
  const t = useTr()
  const schema = useMemo(() => z.object({ login: requiredText(t) }), [t])
  const mutation = useMutation({
    mutationFn: (login: string) => postLoginOtpRequest({ login_challenge: challenge, login }),
    onSuccess: (_result, login) => onSent(login),
    onError: (error) => {
      followChallengeUsed(error)
    },
  })
  const form = useAppForm({
    defaultValues: { login: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value.login.trim()).catch(() => undefined)
    },
  })

  return (
    <FlowCard
      title={t("loginOtp.title")}
      description={t("loginOtp.description", { client: clientName })}
      footer={
        <nav aria-label={t("login.helpLinks")} className="flex flex-col">
          <TextLink href={withChallenge("/login/", "login_challenge", challenge)}>
            {t("loginOtp.backToPassword")}
          </TextLink>
          <TextLink href="/recovery/otp/">{t("loginOtp.lostAccess")}</TextLink>
        </nav>
      }
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
        <ErrorAlert error={mutation.error} />
        <LoadingButton
          type="submit"
          className="h-11 text-base"
          loading={mutation.isPending}
          loadingLabel={t("idCommon.working")}
        >
          {t("loginOtp.sendCode")}
        </LoadingButton>
      </form>
    </FlowCard>
  )
}
