"use client"

import { useT } from "@ihsp/i18n"
import { DatePicker } from "@ihsp/ui"
import { LabeledField } from "../../shared/components/labeled-field"

/** From and to dates of the statistics; clearing a date goes back to the default range. */
export function WorkOffsRangeFields({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (from: string | null, to: string | null) => void
}) {
  const t = useT("workOffs")
  return (
    <>
      <LabeledField label={t("from")} htmlFor="work-offs-from" className="w-44">
        <DatePicker id="work-offs-from" value={from} max={to} onChange={(date) => onChange(date, to)} />
      </LabeledField>
      <LabeledField label={t("to")} htmlFor="work-offs-to" className="w-44">
        <DatePicker id="work-offs-to" value={to} min={from} onChange={(date) => onChange(from, date)} />
      </LabeledField>
    </>
  )
}
