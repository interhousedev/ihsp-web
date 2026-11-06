"use client"

import { Button, Label, LoadingButton, RadioGroup, RadioGroupItem } from "@ihsp/ui"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { TextField } from "../../shared/components/text-field"
import { useTr } from "../../shared/hooks/use-tr"

type Method = "birth-date" | "unique"

const BIRTH_DATE = /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(19|20)\d{2}$/

type RegisterFirstTimeStepProps = {
  pending: boolean
  error: unknown
  onSubmit: (values: { emis_login: string; emis_password: string }) => void
  onBack: () => void
}

/**
 * For a student who never logged in to EMIS: the typed EMIS ID and the initial password EMIS issued, either the date
 * of birth or a unique password from the lyceum. EMIS checks them; nothing is looked up or shown before that.
 */
export function RegisterFirstTimeStep({ pending, error, onSubmit, onBack }: RegisterFirstTimeStepProps) {
  const t = useTr()
  const [emisId, setEmisId] = useState("")
  const [method, setMethod] = useState<Method>("birth-date")
  const [birthDate, setBirthDate] = useState("")
  const [unique, setUnique] = useState("")
  const birthDateInvalid = method === "birth-date" && birthDate.length === 8 && !BIRTH_DATE.test(birthDate)
  const credential = method === "birth-date" ? (BIRTH_DATE.test(birthDate) ? birthDate : "") : unique
  const ready = emisId.trim().length > 0 && credential.length > 0

  return (
    <FlowCard title={t("register.firstTime.title")} description={t("register.firstTime.description")}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (ready) onSubmit({ emis_login: emisId.trim(), emis_password: credential })
        }}
      >
        <TextField
          label={t("register.firstTime.emisId")}
          inputMode="numeric"
          autoComplete="off"
          value={emisId}
          onValueChange={setEmisId}
        />
        <RadioGroup value={method} onValueChange={(value) => setMethod(value as Method)}>
          <div className="flex min-h-11 items-center gap-2">
            <RadioGroupItem id="first-time-birth-date" value="birth-date" />
            <Label htmlFor="first-time-birth-date">{t("register.firstTime.useBirthDate")}</Label>
          </div>
          <div className="flex min-h-11 items-center gap-2">
            <RadioGroupItem id="first-time-unique" value="unique" />
            <Label htmlFor="first-time-unique">{t("register.firstTime.useUnique")}</Label>
          </div>
        </RadioGroup>
        <TextField
          label={t("register.firstTime.birthDate")}
          description={t("register.firstTime.birthDateHint")}
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          disabled={method !== "birth-date"}
          error={birthDateInvalid ? t("register.firstTime.birthDateInvalid") : null}
          value={method === "birth-date" ? birthDate : ""}
          onValueChange={(value) => setBirthDate(value.replace(/\D/g, ""))}
        />
        {method === "unique" ? (
          <TextField
            label={t("register.firstTime.unique")}
            type="password"
            autoComplete="off"
            value={unique}
            onValueChange={setUnique}
          />
        ) : null}
        <ErrorAlert error={error} />
        <LoadingButton
          type="submit"
          className="h-11 text-base"
          disabled={!ready}
          loading={pending}
          loadingLabel={t("idCommon.working")}
        >
          {t("register.submit")}
        </LoadingButton>
        <Button type="button" variant="ghost" className="h-11 text-base" onClick={onBack}>
          {t("register.firstTime.back")}
        </Button>
      </form>
    </FlowCard>
  )
}
