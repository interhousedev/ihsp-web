"use client"

import { useT } from "@ihsp/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export type SemesterOption = { value: number; label?: string }

/** Semester picker (1–8 by default). `value` is the semester number. */
export function SemesterSwitcher({
  value,
  onChange,
  semesters,
  className,
}: {
  value: number
  onChange: (semester: number) => void
  /** Available semesters; default 1..8. Pass `label` to override the default "Semester N". */
  semesters?: SemesterOption[]
  className?: string
}) {
  const t = useT()
  const base: SemesterOption[] = semesters ?? Array.from({ length: 8 }, (_, index) => ({ value: index + 1 }))
  const options = base.map((option) => ({
    value: String(option.value),
    label: option.label ?? t("semester.label", { number: option.value }),
  }))
  return (
    <Select
      items={options}
      value={String(value)}
      onValueChange={(next) => {
        if (next !== null) onChange(Number(next))
      }}
    >
      <SelectTrigger aria-label={t("semester.switcher")} className={className ?? "min-h-11 w-44 md:min-h-8"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
