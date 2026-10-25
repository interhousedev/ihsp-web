"use client"

import type { Question } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { moveItem, newOption, type QuestionOption } from "../utils/content-ops"

/**
 * The options of a single or multiple choice question: text, correct (one for single choice), pinned (keeps its place
 * when options are shuffled, for "None of the above"), reorder and remove.
 */
export function OptionListEditor({
  questionId,
  type,
  options,
  keyOf,
  onChange,
}: {
  questionId: string
  type: Question["type"]
  options: QuestionOption[]
  keyOf: (id: string) => string
  onChange: (options: QuestionOption[]) => void
}) {
  const t = useT("testBuilder")
  const single = type === "single"

  function update(index: number, patch: Partial<QuestionOption>) {
    onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  function setCorrect(index: number, correct: boolean) {
    onChange(
      options.map((option, i) =>
        single ? { ...option, correct: i === index } : i === index ? { ...option, correct } : option,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {options.map((option, index) => (
          <li key={keyOf(option.id)} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
            <input
              type={single ? "radio" : "checkbox"}
              name={`correct-${questionId}`}
              checked={option.correct}
              onChange={(event) => setCorrect(index, single ? true : event.target.checked)}
              aria-label={t("markCorrect", { number: index + 1 })}
              className="accent-primary size-5 shrink-0"
            />
            <Input
              value={option.text}
              onChange={(event) => update(index, { text: event.target.value })}
              aria-label={t("optionText", { number: index + 1 })}
              placeholder={t("optionPlaceholder")}
              className="h-11 min-w-[8rem] flex-1 md:h-8"
            />
            <label className="flex min-h-11 items-center gap-1.5 text-xs md:min-h-8">
              <input
                type="checkbox"
                checked={option.pinned}
                onChange={(event) => update(index, { pinned: event.target.checked })}
                className="accent-primary size-4"
              />
              {t("pinned")}
            </label>
            <div className="ms-auto flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => onChange(moveItem(options, index, index - 1))}
                aria-label={t("moveOptionUp", { number: index + 1 })}
                className="size-11 md:size-8"
              >
                <Icons.chevronUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === options.length - 1}
                onClick={() => onChange(moveItem(options, index, index + 1))}
                aria-label={t("moveOptionDown", { number: index + 1 })}
                className="size-11 md:size-8"
              >
                <Icons.chevronDown aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(options.filter((_, i) => i !== index))}
                aria-label={t("removeOption", { number: index + 1 })}
                className="size-11 md:size-8"
              >
                <Icons.trash aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...options, newOption()])}
        className="w-fit min-h-11 md:min-h-7"
      >
        <Icons.add aria-hidden />
        {t("addOption")}
      </Button>
    </div>
  )
}
