"use client"

import {
  ChoiceCard,
  ChoiceCardGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@ihsp/ui"
import { StudyFieldSelect } from "../../features/chooser/components/study-field-select"
import { useId } from "react"
import type { StepOption, StepQuestion, StepValue } from "./types"

type FieldProps = {
  question: StepQuestion
  value: StepValue
  onChange: (value: StepValue) => void
  /** `compact` renders pills for the editable panel instead of large cards. */
  compact?: boolean
  disabled?: boolean
}

function OptionBody({ option }: { option: StepOption }) {
  return (
    <span className="flex items-center gap-2">
      {option.emoji ? (
        <span aria-hidden className="text-xl leading-none">
          {option.emoji}
        </span>
      ) : null}
      {option.icon}
      <span className="min-w-0 pr-1 break-words">{option.label}</span>
    </span>
  )
}

/** Single choice (radio cards) and boolean pairs. */
export function ChoiceField({ question, value, onChange, compact, disabled }: FieldProps) {
  const name = useId()
  const columns = compact ? 1 : question.options.length === 3 ? 3 : 2
  return (
    <ChoiceCardGroup
      legend={compact ? question.title : <span className="sr-only">{question.title}</span>}
      columns={columns}
    >
      {question.options.map((option) => (
        <ChoiceCard
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          disabled={disabled}
          onChange={() => onChange(option.value)}
          className={cn(compact && "min-h-9 rounded-full px-3 py-1.5", !compact && "items-center gap-4")}
          title={<OptionBody option={option} />}
          description={compact ? undefined : option.description}
        />
      ))}
    </ChoiceCardGroup>
  )
}

/** The picks after toggling `option`; an exclusive option replaces all others and any other pick drops it. */
function toggled(options: StepOption[], picked: string[], option: StepOption): string[] {
  if (picked.includes(option.value)) return picked.filter((item) => item !== option.value)
  if (option.exclusive) return [option.value]
  const exclusive = new Set(options.filter((item) => item.exclusive).map((item) => item.value))
  return [...picked.filter((item) => !exclusive.has(item)), option.value]
}

/** Several picks as toggle chips (checkboxes). */
export function ChipsField({ question, value, onChange, disabled }: FieldProps) {
  const picked = Array.isArray(value) ? value : []
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{question.title}</legend>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option) => {
          const on = picked.includes(option.value)
          return (
            <div
              key={option.value}
              className={cn(
                "border-hairline-strong has-[:focus-visible]:ring-ring/50 flex min-h-9 items-center rounded-full border text-sm transition-colors has-[:focus-visible]:ring-[3px]",
                on ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent",
              )}
            >
              <label
                className={cn("flex min-h-11 cursor-pointer items-center gap-2 py-1.5 pl-3 md:min-h-9", option.info ? "pr-1" : "pr-3")}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={disabled}
                  onChange={() => onChange(toggled(question.options, picked, option))}
                />
                <OptionBody option={option} />
              </label>
              {option.info}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

/** A dropdown; the label is the question (visible when `compact`, otherwise the step title above it). */
export function SelectField({ question, value, onChange, compact, disabled }: FieldProps) {
  const labelId = useId()
  const current = typeof value === "string" ? value : null
  const items = question.options.map((option) => ({ value: option.value, label: option.label }))
  if (question.sheet) {
    const groups = [{ id: question.id, label: "", items: items.map(({ value, label }) => ({ id: value, label })) }]
    return (
      <div className="flex flex-col gap-1.5">
        <span id={labelId} className={compact ? "text-sm font-medium" : "sr-only"}>
          {question.title}
        </span>
        <StudyFieldSelect
          id={`${labelId}-sheet`}
          value={current ?? ""}
          groups={groups}
          placeholder={question.placeholder}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {compact ? (
        <span id={labelId} className="text-sm font-medium">
          {question.title}
        </span>
      ) : (
        <span id={labelId} className="sr-only">
          {question.title}
        </span>
      )}
      <Select items={items} value={current ?? ""} disabled={disabled} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue placeholder={question.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {question.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** The field matching the question kind. */
export function QuestionField(props: FieldProps) {
  switch (props.question.kind) {
    case "multi":
      return <ChipsField {...props} />
    case "select":
      return <SelectField {...props} />
    default:
      return <ChoiceField {...props} />
  }
}
