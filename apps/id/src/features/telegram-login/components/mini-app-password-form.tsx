"use client"

import { Button, LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, useState } from "react"
import { z } from "zod"
import { ErrorAlert, InfoAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { TextLink } from "../../shared/components/text-link"
import { useTr } from "../../shared/hooks/use-tr"
import { requiredText } from "../../shared/utils/schemas"
import { readSession, TELEGRAM_NEW_LOGIN_KEY } from "../../shared/utils/storage"
import { useTelegramLogin, type TelegramCredentials } from "../hooks/use-telegram-login"

type MiniAppPasswordFormProps = {
  initData: string
  onLinked: (login: string) => void
  onSecondFactor: (credentials: { login: string; password: string }) => void
  onOtp: () => void
}

/** The mini app login form: login and password; **Log in with OTP** and registration are one tap away. */
export function MiniAppPasswordForm({ initData, onLinked, onSecondFactor, onOtp }: MiniAppPasswordFormProps) {
  const t = useTr()
  const [newLogin] = useState(() => readSession(TELEGRAM_NEW_LOGIN_KEY))
  const schema = useMemo(
    () => z.object({ login: requiredText(t), password: z.string().min(1, t("idCommon.validation.required")) }),
    [t],
  )
  const mutation = useTelegramLogin(initData, {
    onLinked,
    onSecondFactor: (credentials: TelegramCredentials) =>
      onSecondFactor({ login: credentials.login, password: credentials.password ?? "" }),
  })
  const form = useAppForm({
    defaultValues: { login: newLogin ?? "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ login: value.login.trim(), password: value.password }).catch(() => undefined)
    },
  })

  return (
    <FlowCard
      title={t("miniApp.title")}
      description={t("miniApp.description")}
      footer={<TextLink href="/recovery/password/">{t("login.forgotPassword")}</TextLink>}
    >
      {newLogin ? <InfoAlert>{t("miniApp.registered", { login: newLogin })}</InfoAlert> : null}
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
        <ErrorAlert error={mutation.error} />
        <LoadingButton
          type="submit"
          className="h-11 text-base"
          loading={mutation.isPending}
          loadingLabel={t("idCommon.working")}
        >
          {t("miniApp.submit")}
        </LoadingButton>
      </form>
      <Button type="button" variant="outline" className="h-11" onClick={onOtp}>
        {t("login.withOtp")}
      </Button>
      <LinkButton href="/register/" variant="outline">
        {t("miniApp.register")}
      </LinkButton>
    </FlowCard>
  )
}
