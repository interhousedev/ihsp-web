"use client"

import type { Question } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Field, FieldDescription, FieldLabel, Input, Textarea } from "@ihsp/ui"
import { useId } from "react"

type Answer = NonNullable<Question["answer"]>

/** The accepted answers of a text question (one per line, or a regular expression) and the value of a number question. */
export function AnswerConfigEditor({
  type,
  answer,
  onChange,
}: {
  type: "text" | "number"
  answer: Question["answer"]
  onChange: (answer: Answer) => void
}) {
  const t = useT("testBuilder")
  const acceptedId = useId()
  const regexId = useId()
  const valueId = useId()
  const toleranceId = useId()
  const current: Answer = answer ?? {}

  if (type === "number") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={valueId}>{t("correctValue")}</FieldLabel>
          <Input
            id={valueId}
            type="number"
            step="any"
            value={current.value ?? ""}
            onChange={(event) =>
              onChange({
                ...current,
                value: event.target.value === "" ? undefined : Number(event.target.value),
              })
            }
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={toleranceId}>{t("tolerance")}</FieldLabel>
          <Input
            id={toleranceId}
            type="number"
            step="any"
            min={0}
            value={current.tolerance ?? 0}
            onChange={(event) =>
              onChange({
                ...current,
                tolerance: event.target.value === "" ? 0 : Number(event.target.value),
              })
            }
            className="h-11 md:h-8"
          />
          <FieldDescription>{t("toleranceHint")}</FieldDescription>
        </Field>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor={acceptedId}>{t("acceptedAnswers")}</FieldLabel>
        <Textarea
          id={acceptedId}
          value={(current.accepted ?? []).join("\n")}
          onChange={(event) => onChange({ ...current, accepted: event.target.value.split("\n") })}
          rows={3}
        />
        <FieldDescription>{t("acceptedHint")}</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={regexId}>{t("regex")}</FieldLabel>
        <Input
          id={regexId}
          value={current.regex ?? ""}
          onChange={(event) =>
            onChange({
              ...current,
              regex: event.target.value === "" ? null : event.target.value,
            })
          }
          className="h-11 font-mono md:h-8"
        />
        <FieldDescription>{t("regexHint")}</FieldDescription>
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
        <input
          type="checkbox"
          checked={current.case_sensitive ?? false}
          onChange={(event) => onChange({ ...current, case_sensitive: event.target.checked })}
          className="accent-primary size-4"
        />
        {t("caseSensitive")}
      </label>
    </div>
  )
}
