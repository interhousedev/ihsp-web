"use client"

import type { Question } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Field, FieldLabel, Input, Textarea } from "@ihsp/ui"
import { useId } from "react"
import { PatternEditor } from "./pattern-editor"

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
      </Field>
      <PatternEditor
        label={t("patternRule")}
        regex={current.regex}
        onChange={(regex) => onChange({ ...current, regex })}
        ignoreCase={!(current.case_sensitive ?? false)}
        onIgnoreCaseChange={(ignore) => onChange({ ...current, case_sensitive: !ignore })}
      />
    </div>
  )
}
