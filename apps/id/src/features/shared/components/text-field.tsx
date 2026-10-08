"use client"

import { Field, FieldDescription, FieldError, FieldLabel, Input, PasswordInput } from "@ihsp/ui"
import { useId, type ChangeEvent, type ComponentProps } from "react"

type TextFieldProps = Omit<ComponentProps<"input">, "value" | "onChange" | "id"> & {
  label: string
  value: string
  onValueChange: (value: string) => void
  description?: string
  error?: string | null
}

/** A labelled controlled input for the few forms that do not use TanStack Form (connector and deletion forms). */
export function TextField({
  label,
  value,
  onValueChange,
  description,
  error,
  className,
  type,
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const shared = {
    id,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => onValueChange(event.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: `h-11 text-base ${className ?? ""}`,
    ...inputProps,
  }
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {/* Passwords get the show/hide eye button. */}
      {type === "password" ? <PasswordInput {...shared} /> : <Input type={type} {...shared} />}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
}
