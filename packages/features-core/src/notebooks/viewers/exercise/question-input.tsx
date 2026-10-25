"use client"

import type { ExerciseQuestion } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input, cn } from "@ihsp/ui"
import { useId } from "react"
import { withinLimit, type ExerciseAnswer } from "./grading"

type InputProps = {
  question: ExerciseQuestion
  answer: ExerciseAnswer | undefined
  /** After Submit the inputs are read-only and show what was right. */
  submitted: boolean
  onAnswer: (answer: ExerciseAnswer) => void
}

const CHOICE =
  "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"

function choiceClass(selected: boolean, submitted: boolean, correct: boolean): string {
  if (submitted && correct) return cn(CHOICE, "border-emerald-600 bg-emerald-50 dark:bg-emerald-950")
  if (submitted && selected) return cn(CHOICE, "border-destructive bg-destructive/10")
  return cn(CHOICE, selected ? "border-primary bg-primary/5" : "border-border")
}

/** Single choice and T/F/NG as radios, multiple choice as checkboxes. */
function ChoiceInput({ question, answer, submitted, onAnswer }: InputProps) {
  const t = useT("notebooks.exercise")
  const name = useId()
  const multiple = question.type === "multiple_choice"
  const chosen = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : []
  const label = (option: ExerciseQuestion["options"][number]) =>
    question.type === "true_false_not_given" ? t(`tfng.${option.id}`) : option.text
  const toggle = (id: string, checked: boolean) =>
    onAnswer(checked ? [...chosen.filter((c) => c !== id), id] : chosen.filter((c) => c !== id))

  return (
    <div role={multiple ? "group" : "radiogroup"} aria-label={question.prompt} className="flex flex-col gap-2">
      {multiple ? <p className="text-muted-foreground text-xs">{t("chooseAll")}</p> : null}
      {question.options.map((option) => {
        const selected = chosen.includes(option.id)
        return (
          <label key={option.id} className={choiceClass(selected, submitted, question.correct.includes(option.id))}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              className="mt-0.5 size-4 shrink-0 accent-current"
              checked={selected}
              disabled={submitted}
              onChange={(event) => (multiple ? toggle(option.id, event.target.checked) : onAnswer(option.id))}
            />
            <span className="min-w-0">
              {question.type === "true_false_not_given" ? null : (
                <span className="text-muted-foreground mr-1 font-medium">{option.id}.</span>
              )}
              {label(option)}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/** Matching: the options (e.g. headings) once, then one select per item (e.g. paragraph). */
function MatchingInput({ question, answer, submitted, onAnswer }: InputProps) {
  const t = useT("notebooks.exercise")
  const given = answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {}
  return (
    <div className="flex flex-col gap-3">
      <ul className="bg-muted/50 flex flex-col gap-1 rounded-lg p-3 text-sm">
        {question.options.map((option) => (
          <li key={option.id}>
            <span className="font-medium">{option.id}.</span> {option.text}
          </li>
        ))}
      </ul>
      {question.items.map((item) => {
        const value = given[item.id] ?? ""
        const right = value === item.answer
        return (
          <label key={item.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">{item.text}</span>
            <span className="flex items-center gap-2">
              <select
                className={cn(
                  "border-input bg-background min-h-11 rounded-md border px-2 text-sm md:min-h-8",
                  submitted && (right ? "border-emerald-600" : "border-destructive"),
                )}
                value={value}
                disabled={submitted}
                onChange={(event) => onAnswer({ ...given, [item.id]: event.target.value })}
              >
                <option value="">{t("choose")}</option>
                {question.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.id}
                  </option>
                ))}
              </select>
              {submitted && !right ? (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">{item.answer}</span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/** Gap fill and short answer: a text input with the word limit as a hint. */
function TextInput({ question, answer, submitted, onAnswer }: InputProps) {
  const t = useT("notebooks.exercise")
  const hintId = useId()
  const value = typeof answer === "string" ? answer : ""
  const over = !withinLimit(value, question.word_limit)
  return (
    <div className="flex flex-col gap-1">
      <Input
        value={value}
        disabled={submitted}
        aria-label={t("answer")}
        aria-describedby={question.word_limit > 0 ? hintId : undefined}
        aria-invalid={over || undefined}
        placeholder={t("answer")}
        className="min-h-11 md:min-h-8"
        autoComplete="off"
        onChange={(event) => onAnswer(event.target.value)}
      />
      {question.word_limit > 0 ? (
        <p id={hintId} className={over ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
          {t("wordLimit", { count: question.word_limit })}
        </p>
      ) : null}
      {submitted ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {t("accepted", { answers: question.accepted.join(" / ") })}
        </p>
      ) : null}
    </div>
  )
}

/** The input of an objective question by its type. */
export function QuestionInput(props: InputProps) {
  switch (props.question.type) {
    case "matching":
      return <MatchingInput {...props} />
    case "gap_fill":
    case "short_answer":
      return <TextInput {...props} />
    case "free_response":
      return null
    default:
      return <ChoiceInput {...props} />
  }
}
