"use client"

import { LoadingButton, useAppForm } from "@ihsp/ui"
import { useMemo, type ComponentProps } from "react"
import { z } from "zod"
import { useTr } from "../hooks/use-tr"
import { emailText, requiredText } from "../utils/schemas"
import { ErrorAlert } from "./error-alert"

type SingleFieldFormProps = {
  label: string
  description?: string
  kind: "text" | "email"
  submitLabel: string
  pending: boolean
  error: unknown
  onSubmit: (value: string) => void
  autoComplete?: ComponentProps<"input">["autoComplete"]
}

/** A form with one text or email field and a submit button (recovery requests). */
export function SingleFieldForm({
  label,
  description,
  kind,
  submitLabel,
  pending,
  error,
  onSubmit,
  autoComplete,
}: SingleFieldFormProps) {
  const t = useTr()
  const schema = useMemo(() => z.object({ value: kind === "email" ? emailText(t) : requiredText(t) }), [t, kind])
  const form = useAppForm({
    defaultValues: { value: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value.value.trim()),
  })
  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="value">
        {(field) => (
          <field.TextField
            label={label}
            description={description}
            type={kind === "email" ? "email" : "text"}
            inputMode={kind === "email" ? "email" : undefined}
            autoComplete={autoComplete}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 text-base"
          />
        )}
      </form.AppField>
      <ErrorAlert error={error} />
      <LoadingButton type="submit" className="h-11 text-base" loading={pending} loadingLabel={t("idCommon.working")}>
        {submitLabel}
      </LoadingButton>
    </form>
  )
}
