"use client"

import type { JournalOption } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { NativeSelect } from "@ihsp/ui"
import { useId } from "react"
import { optionValue, parseOptionValue } from "../utils/selection"

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
      <NativeSelect
        className="w-full sm:w-80 [&_select]:h-11 md:[&_select]:h-8"
        id={id}
        value={selected ? optionValue(selected) : ""}
        onChange={(event) => {
          const parsed = parseOptionValue(event.target.value)
          if (parsed) onChange(parsed.subject, parsed.audience)
        }}
      >
        {options.map((option) => (
          <option key={optionValue(option)} value={optionValue(option)}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}
