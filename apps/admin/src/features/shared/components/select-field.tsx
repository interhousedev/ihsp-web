"use client"

import { NativeSelect, NativeSelectOption } from "@ihsp/ui"
import { TOUCH_SELECT } from "../utils/touch"

export type SelectOption = { value: string; label: string; disabled?: boolean }

/**
 * A native `<select>` (reliable on phones and with a screen reader). `emptyLabel` adds a first option with the
 * empty value; the value `null` or `""` selects it.
 */
export function SelectField({
  id,
  value,
  onChange,
  options,
  emptyLabel,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  options: readonly SelectOption[]
  emptyLabel?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}) {
  return (
    <NativeSelect
      id={id}
      value={value ?? ""}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={`${TOUCH_SELECT} ${className ?? "w-full"}`}
    >
      {emptyLabel !== undefined ? <NativeSelectOption value="">{emptyLabel}</NativeSelectOption> : null}
      {options.map((option) => (
        <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
