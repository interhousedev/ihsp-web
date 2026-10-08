"use client"

import type { Answer } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, Markdown } from "@ihsp/ui"
import type { AttemptQuestion } from "../utils/answers"

/** One question of an open attempt. It holds no correctness: the browser never gets it before submitting (LMS-17). */
export function QuestionField({
  question,
  index,
  answer,
  onChange,
  disabled,
}: {
  question: AttemptQuestion
  index: number
  answer: Answer | undefined
  onChange: (answer: Answer | null) => void
  disabled?: boolean
}) {
  const t = useT("test")
  const selected = answer?.option_ids ?? []
  const legendId = `question-${question.id}`

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border p-3" disabled={disabled} aria-labelledby={legendId}>
      <div id={legendId} className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">{t("questionNumber", { number: index + 1 })}</span>
          <span className="text-muted-foreground text-xs">{t("points", { count: question.points })}</span>
        </div>
        <Markdown>{question.prompt}</Markdown>
      </div>

      {question.type === "single" || question.type === "multiple" ? (
        <div
          className="flex flex-col gap-1.5"
          role={question.type === "single" ? "radiogroup" : "group"}
          aria-labelledby={legendId}
        >
          {(question.options ?? []).map((option) => {
            const checked = selected.includes(option.id)
            const multiple = question.type === "multiple"
            return (
              <label
                key={option.id}
                className="hover:bg-muted/60 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={question.id}
                  value={option.id}
                  checked={checked}
                  onChange={() => {
                    if (multiple) {
                      const next = checked ? selected.filter((id) => id !== option.id) : [...selected, option.id]
                      onChange({ option_ids: next })
                    } else {
                      onChange({ option_ids: [option.id] })
                    }
                  }}
                  className="accent-primary size-5 shrink-0"
                />
                <span className="min-w-0 break-words">{option.text}</span>
              </label>
            )
          })}
        </div>
      ) : null}

      {question.type === "text" ? (
        <Input
          value={answer?.text ?? ""}
          onChange={(event) => onChange({ text: event.target.value })}
          aria-labelledby={legendId}
          placeholder={t("textPlaceholder")}
          autoComplete="off"
          className="h-11 md:h-8"
        />
      ) : null}

      {question.type === "number" ? (
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          value={answer?.number ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? null : { number: Number(event.target.value) })}
          aria-labelledby={legendId}
          placeholder={t("numberPlaceholder")}
          className="h-11 md:h-8"
        />
      ) : null}
    </fieldset>
  )
}
