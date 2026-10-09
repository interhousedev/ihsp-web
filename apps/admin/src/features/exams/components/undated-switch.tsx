"use client"

import { useT } from "@ihsp/i18n"
import { Switch } from "@ihsp/ui"
import { useId } from "react"

/** "Show control weeks without a date": adds the weeks that no subject has a date for (`undated=true`). */
export function UndatedSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useT("exams.filters")
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-2 md:min-h-8">
      <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      <label htmlFor={id} className="text-sm">
        {t("undated")}
      </label>
    </div>
  )
}
