"use client"

import { Field, FieldDescription, FieldError, FieldLabel } from "@ihsp/ui"
import type { ReactNode } from "react"

/** A label, a control, an optional hint and the validation message of one field of the exam form. */
export function ExamField({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  errors: readonly ({ message?: string } | undefined)[]
  children: ReactNode
}) {
  return (
    <Field data-invalid={errors.length > 0}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      <FieldError errors={[...errors]} />
    </Field>
  )
}
