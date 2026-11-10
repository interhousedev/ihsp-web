"use client"

import { postChangeEmisPassword } from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  LoadingButton,
  RadioGroup,
  RadioGroupItem,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { CodeInput } from "../../shared/components/code-input"
import { ErrorAlert } from "../../shared/components/error-alert"
import { StepUpSender } from "../../shared/components/step-up-sender"
import { TextField } from "../../shared/components/text-field"
import { useTr } from "../../shared/hooks/use-tr"

type SecondFactor = "password" | "code"

/** Changes the password in EMIS itself: the current EMIS password plus the account password or a step-up code. */
export function ChangeEmisPasswordForm() {
  const t = useTr()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [factor, setFactor] = useState<SecondFactor>("password")
  const [accountPassword, setAccountPassword] = useState("")
  const [code, setCode] = useState("")
  const mutation = useMutation({
    mutationFn: () =>
      postChangeEmisPassword({
        current_emis_password: current,
        new_emis_password: next,
        ...(factor === "password" ? { account_password: accountPassword } : { otp_code: code }),
      }),
    onSuccess: () => {
      setCurrent("")
      setNext("")
      setRepeat("")
      setAccountPassword("")
      setCode("")
    },
  })
  const mismatch = repeat.length > 0 && next !== repeat
  const factorReady = factor === "password" ? accountPassword.length > 0 : code.length === 6
  const ready = current.length > 0 && next.length > 0 && next === repeat && factorReady

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.emis.change.title")}</CardTitle>
        <CardDescription>{t("security.emis.change.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (ready) mutation.mutate()
          }}
        >
          <TextField
            label={t("security.emis.change.current")}
            type="password"
            autoComplete="off"
            value={current}
            onValueChange={setCurrent}
          />
          <TextField
            label={t("idCommon.newPassword")}
            type="password"
            autoComplete="off"
            value={next}
            onValueChange={setNext}
          />
          <TextField
            label={t("idCommon.confirmPassword")}
            type="password"
            autoComplete="off"
            value={repeat}
            onValueChange={setRepeat}
          />
          {mismatch ? (
            <p role="alert" className="text-destructive text-sm">
              {t("security.emis.change.mismatch")}
            </p>
          ) : null}
          <fieldset className="grid gap-3">
            <legend className="mb-2 text-sm font-medium">{t("security.emis.change.verifyWith")}</legend>
            <RadioGroup value={factor} onValueChange={(value) => setFactor(value as SecondFactor)}>
              <div className="flex min-h-11 items-center gap-2">
                <RadioGroupItem id="emis-factor-password" value="password" />
                <Label htmlFor="emis-factor-password">{t("security.emis.change.withPassword")}</Label>
              </div>
              <div className="flex min-h-11 items-center gap-2">
                <RadioGroupItem id="emis-factor-code" value="code" />
                <Label htmlFor="emis-factor-code">{t("security.emis.change.withCode")}</Label>
              </div>
            </RadioGroup>
            {factor === "password" ? (
              <TextField
                label={t("security.currentPassword")}
                type="password"
                autoComplete="current-password"
                value={accountPassword}
                onValueChange={setAccountPassword}
              />
            ) : (
              <div className="grid gap-3">
                <CodeInput value={code} onChange={setCode} label={t("idCommon.code")} />
                <StepUpSender />
              </div>
            )}
          </fieldset>
          <ErrorAlert error={mutation.error} />
          {mutation.isSuccess ? (
            <Alert role="status">
              <AlertDescription>{t("security.emis.change.done")}</AlertDescription>
            </Alert>
          ) : null}
          <LoadingButton
            type="submit"
            className="h-11 text-base"
            disabled={!ready}
            loading={mutation.isPending}
            loadingLabel={t("idCommon.working")}
          >
            {t("security.emis.change.submit")}
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}
