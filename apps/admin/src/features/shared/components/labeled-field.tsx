import { Field, FieldDescription, FieldLabel } from "@ihsp/ui"
import type { ReactNode } from "react"

/** A label above a control; `htmlFor` must match the control's `id`. */
export function LabeledField({
  label,
  htmlFor,
  description,
  required,
  children,
  className,
}: {
  label: string
  htmlFor: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </FieldLabel>
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}
