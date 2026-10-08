"use client"

import type { Question } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Field, FieldLabel, Icons, Input, NativeSelect, NativeSelectOption, Textarea } from "@ihsp/ui"
import { useId } from "react"
import { QUESTION_TYPES, changeQuestionType, type QuestionType } from "../utils/content-ops"
import { AnswerConfigEditor } from "./answer-config-editor"
import { OptionListEditor } from "./option-list-editor"

/** One question of a test: type, prompt, points, answer data, explanation. */
export function QuestionEditor({
  question,
  index,
  total,
  keyOf,
  onChange,
  onMove,
  onRemove,
}: {
  question: Question
  index: number
  total: number
  keyOf: (id: string) => string
  onChange: (question: Question) => void
  onMove: (direction: "up" | "down") => void
  onRemove: () => void
}) {
  const t = useT("testBuilder")
  const typeId = useId()
  const promptId = useId()
  const pointsId = useId()
  const explanationId = useId()

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-3" data-question-id={question.id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{t("question", { number: index + 1 })}</h4>
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove("up")}
            aria-label={t("moveQuestionUp", { number: index + 1 })}
            className="size-11 md:size-8"
          >
            <Icons.chevronUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onMove("down")}
            aria-label={t("moveQuestionDown", { number: index + 1 })}
            className="size-11 md:size-8"
          >
            <Icons.chevronDown aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={t("removeQuestion", { number: index + 1 })}
            className="size-11 md:size-8"
          >
            <Icons.trash aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Field>
          <FieldLabel htmlFor={typeId}>{t("type")}</FieldLabel>
          <NativeSelect
            id={typeId}
            value={question.type}
            onChange={(event) => {
              const next = QUESTION_TYPES.find((item): item is QuestionType => item === event.target.value)
              if (next) onChange(changeQuestionType(question, next))
            }}
            className="w-full"
          >
            {QUESTION_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {t(`types.${type}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={pointsId}>{t("points")}</FieldLabel>
          <Input
            id={pointsId}
            type="number"
            min={0}
            step="any"
            value={question.points}
            onChange={(event) =>
              onChange({ ...question, points: event.target.value === "" ? 0 : Number(event.target.value) })
            }
            className="h-11 md:h-8"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={promptId}>{t("prompt")}</FieldLabel>
        <Textarea
          id={promptId}
          value={question.prompt}
          onChange={(event) => onChange({ ...question, prompt: event.target.value })}
          rows={3}
        />
      </Field>

      {question.type === "single" || question.type === "multiple" ? (
        <OptionListEditor
          questionId={question.id}
          type={question.type}
          options={question.options ?? []}
          keyOf={keyOf}
          onChange={(options) => onChange({ ...question, options })}
        />
      ) : (
        <AnswerConfigEditor
          type={question.type}
          answer={question.answer}
          onChange={(answer) => onChange({ ...question, answer })}
        />
      )}

      <Field>
        <FieldLabel htmlFor={explanationId}>{t("explanation")}</FieldLabel>
        <Textarea
          id={explanationId}
          value={question.explanation ?? ""}
          onChange={(event) =>
            onChange({ ...question, explanation: event.target.value === "" ? null : event.target.value })
          }
          rows={2}
        />
      </Field>
    </li>
  )
}
