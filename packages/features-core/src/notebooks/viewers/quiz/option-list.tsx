"use client"

import type { QuizQuestion } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { KeyboardEvent } from "react"
import { OptionBody, optionClasses } from "./option-body"

type OptionListProps = {
  question: QuizQuestion
  /** The options the student picked (the committed answer, or the draft of a multiple-choice question). */
  chosen: readonly string[]
  /** The answer was checked: mark the right and wrong options. */
  revealed: boolean
  /** Id of the element that holds the question text. */
  labelledBy: string
  /** Id of the "Choose all that apply" line. */
  describedBy?: string
  /** Picks (single, true/false) or toggles (multiple) an option; without it the list is a read-only summary. */
  onChoose?: (optionId: string) => void
}

const ARROW_STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

/** Arrow keys move the focus between the options of a single-choice question without choosing one. */
function moveFocus(event: KeyboardEvent<HTMLButtonElement>) {
  const step = ARROW_STEP[event.key]
  const group = event.currentTarget.closest('[role="radiogroup"]')
  if (step === undefined || !group) return
  const radios = Array.from(group.querySelectorAll<HTMLElement>('[role="radio"]'))
  const index = radios.indexOf(event.currentTarget)
  if (index < 0) return
  event.preventDefault()
  radios[(index + step + radios.length) % radios.length]?.focus()
}

/**
 * The options of a question as large cards: a radio group for single choice and true/false, a checkbox group for
 * multiple choice, a plain list when read-only. A checked answer cannot be changed.
 */
export function OptionList({ question, chosen, revealed, labelledBy, describedBy, onChoose }: OptionListProps) {
  const t = useT("notebooks")
  const label = (option: QuizQuestion["options"][number]) =>
    question.type === "true_false" && (option.id === "true" || option.id === "false")
      ? t(`quiz.${option.id}`)
      : option.text
  const stateOf = (optionId: string) => ({
    selected: chosen.includes(optionId),
    revealed,
    correct: question.correct.includes(optionId),
  })

  if (!onChoose) {
    return (
      <ul aria-labelledby={labelledBy} className="flex flex-col gap-2">
        {question.options.map((option) => (
          <li key={option.id} className={optionClasses(stateOf(option.id))}>
            <OptionBody
              text={label(option)}
              kind={question.type === "multiple" ? "checkbox" : "radio"}
              {...stateOf(option.id)}
            />
          </li>
        ))}
      </ul>
    )
  }

  if (question.type === "multiple") {
    return (
      <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex flex-col gap-2">
        {question.options.map((option) => (
          <label
            key={option.id}
            className={cn(
              optionClasses(stateOf(option.id)),
              "has-[:focus-visible]:ring-ring/50 cursor-pointer has-[:focus-visible]:ring-3",
              revealed && "cursor-default",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={chosen.includes(option.id)}
              aria-disabled={revealed || undefined}
              onChange={() => {
                if (!revealed) onChoose(option.id)
              }}
            />
            <OptionBody text={label(option)} kind="checkbox" {...stateOf(option.id)} />
          </label>
        ))}
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          onKeyDown={moveFocus}
          aria-checked={chosen.includes(option.id)}
          aria-disabled={revealed || undefined}
          className={cn(
            optionClasses(stateOf(option.id)),
            "focus-visible:ring-ring/50 outline-hidden focus-visible:ring-3",
            revealed ? "cursor-default" : "cursor-pointer",
          )}
          onClick={() => {
            if (!revealed) onChoose(option.id)
          }}
        >
          <OptionBody text={label(option)} kind="radio" {...stateOf(option.id)} />
        </button>
      ))}
    </div>
  )
}
