"use client"

import { Dropdown } from "@ihsp/ui"
import { TOUCH_SELECT } from "../utils/touch"

export type SelectOption = { value: string; label: string; disabled?: boolean }

/**
 * A single-choice dropdown. `emptyLabel` adds a first option with the
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
    <Dropdown
      id={id}
      value={value ?? ""}
      disabled={disabled}
      aria-label={ariaLabel}
      onValueChange={onChange}
      className={`${TOUCH_SELECT} ${className ?? "w-full"}`}
      options={[
        ...(emptyLabel !== undefined ? [{ value: "", label: emptyLabel }] : []),
        ...options.map((option) => ({ value: option.value, label: option.label, disabled: option.disabled })),
      ]}
    />
  )
}
