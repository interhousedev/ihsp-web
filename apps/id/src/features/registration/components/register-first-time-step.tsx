"use client"

import { Button, DatePicker, Label, LoadingButton, RadioGroup, RadioGroupItem } from "@ihsp/ui"
import { useState } from "react"
import { ErrorAlert, TextField, useTr } from "@ihsp/features-core/id-account"
import { FlowCard } from "../../shared/components/flow-card"

type Method = "birth-date" | "unique"

/** EMIS expects the date of birth as DDMMYYYY; the picker gives YYYY-MM-DD. */
const toEmisDate = (iso: string) => {
  const [year = "", month = "", day = ""] = iso.split("-")
  return `${day}${month}${year}`
}

const pad = (value: number) => String(value).padStart(2, "0")
const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

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
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const [unique, setUnique] = useState("")
  const credential = method === "birth-date" ? (birthDate ? toEmisDate(birthDate) : "") : unique
  const max = today()
  const typicalBirthYear = Number(max.slice(0, 4)) - 16
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
        <div className="grid gap-2">
          <Label htmlFor="first-time-birth-date-picker">{t("register.firstTime.birthDate")}</Label>
          <DatePicker
            id="first-time-birth-date-picker"
            value={method === "birth-date" ? birthDate : null}
            onChange={setBirthDate}
            placeholder={t("register.firstTime.birthDatePick")}
            disabled={method !== "birth-date"}
            min="1950-01-01"
            max={max}
            defaultMonth={`${typicalBirthYear}-01-01`}
            yearDropdown
          />
        </div>
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
