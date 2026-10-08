"use client"

import { useT } from "@ihsp/i18n"
import { Button, DatePicker } from "@ihsp/ui"
import { LabeledField } from "../../shared/components/labeled-field"
import { TOUCH } from "../../shared/utils/touch"

/** From and to dates; empty means the current term (the server picks the range). */
export function DateRangeFields({
  from,
  to,
  onChange,
}: {
  from: string | null
  to: string | null
  onChange: (from: string | null, to: string | null) => void
}) {
  const t = useT("attendance")
  return (
    <>
      <LabeledField label={t("from")} htmlFor="range-from" className="w-44">
        <DatePicker
          id="range-from"
          value={from}
          max={to ?? undefined}
          placeholder={t("currentTerm")}
          onChange={(date) => onChange(date, to)}
        />
      </LabeledField>
      <LabeledField label={t("to")} htmlFor="range-to" className="w-44">
        <DatePicker
          id="range-to"
          value={to}
          min={from ?? undefined}
          placeholder={t("currentTerm")}
          onChange={(date) => onChange(from, date)}
        />
      </LabeledField>
      {from || to ? (
        <Button type="button" variant="ghost" className={TOUCH} onClick={() => onChange(null, null)}>
          {t("resetRange")}
        </Button>
      ) : null}
    </>
  )
}
