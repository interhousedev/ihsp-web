"use client"

import { Field, FieldDescription, FieldLabel, Input } from "@ihsp/ui"
import { useId } from "react"

/** A number field where empty means "no value" (`null`), for limits such as attempts, pool size and time. */
export function NullableNumberInput({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max,
  disabled,
  placeholder,
}: {
  label: string
  hint?: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  disabled?: boolean
  placeholder?: string
}) {
  const id = useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="h-11 md:h-8"
      />
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}
