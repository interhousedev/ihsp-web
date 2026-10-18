"use client"

import type { JournalOption } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Dropdown } from "@ihsp/ui"
import { useId } from "react"
import { optionLabel, optionValue, parseOptionValue } from "../utils/selection"

/** Picks the subject and audience the teacher teaches (UF-STF-07 step 1), e.g. "Physics · 2TN2 · subgroup 1". */
export function JournalPicker({
  options,
  selected,
  onChange,
}: {
  options: JournalOption[]
  selected: JournalOption | null
  onChange: (subject: string, audience: string) => void
}) {
  const t = useT("journal")
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {t("pick")}
      </label>
      <Dropdown
        className="w-full sm:w-80"
        id={id}
        value={selected ? optionValue(selected) : ""}
        onValueChange={(value) => {
          const parsed = parseOptionValue(value)
          if (parsed) onChange(parsed.subject, parsed.audience)
        }}
        options={options.map((option) => ({ value: optionValue(option), label: optionLabel(option) }))}
      />
    </div>
  )
}
