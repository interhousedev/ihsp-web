"use client"

import { useT } from "@ihsp/i18n"
import { ChoiceCard, ChoiceCardGroup, Icons, Input, Pill, TagInput, Textarea } from "@ihsp/ui"
import type { AnswerValue, Question } from "../types"
import { useProfileText } from "../lib/use-profile-text"

type FieldProps = {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
}

const LONG_TEXT = 120

function asStrings(value: AnswerValue | undefined): string[] {
  return Array.isArray(value) ? (value as unknown[]).filter((item): item is string => typeof item === "string") : []
}

function ChoiceField({ question, value, onChange, multiple }: FieldProps & { multiple: boolean }) {
  const text = useProfileText()
  const selected = multiple ? asStrings(value) : typeof value === "string" ? [value] : []
  const max = question.max_choices ?? undefined
  const full = multiple && max !== undefined && selected.length >= max
  return (
    <ChoiceCardGroup legend={<span className="sr-only">{text.label(question.id)}</span>} columns={2}>
      {question.options.map((option) => {
        const checked = selected.includes(option)
        return (
          <ChoiceCard
            key={option}
            type={multiple ? "checkbox" : "radio"}
            name={question.id}
            value={option}
            checked={checked}
            disabled={multiple && full && !checked}
            title={text.option(question.id, option)}
            onChange={() =>
              onChange(
                multiple ? (checked ? selected.filter((item) => item !== option) : [...selected, option]) : option,
              )
            }
          />
        )
      })}
    </ChoiceCardGroup>
  )
}

function SwitchField({ question, value, onChange }: FieldProps) {
  const t = useT("profile")
  const text = useProfileText()
  return (
    <ChoiceCardGroup legend={<span className="sr-only">{text.label(question.id)}</span>} columns={2}>
      {[true, false].map((option) => (
        <ChoiceCard
          key={String(option)}
          name={question.id}
          checked={value === option}
          title={t(option ? "yes" : "no")}
          onChange={() => onChange(option)}
        />
      ))}
    </ChoiceCardGroup>
  )
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (value: number | null) => void
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      aria-label={label}
      value={typeof value === "number" ? String(value) : ""}
      onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
    />
  )
}

/** The input of one question; the kind decides which control it is. */
export function QuestionField(props: FieldProps) {
  const { question, value, onChange } = props
  const t = useT("profile")
  const text = useProfileText()
  const label = text.label(question.id)
  switch (question.kind) {
    case "single":
      return <ChoiceField {...props} multiple={false} />
    case "money":
      return question.options.length > 0 ? (
        <ChoiceField {...props} multiple={false} />
      ) : (
        <NumberInput label={label} value={value} onChange={onChange} />
      )
    case "multi":
    case "repeat":
      return <ChoiceField {...props} multiple />
    case "switch":
      return <SwitchField {...props} />
    case "text": {
      const max = question.max_length ?? undefined
      const current = typeof value === "string" ? value : ""
      return (
        <div className="flex flex-col gap-1">
          {max === undefined || max > LONG_TEXT ? (
            <Textarea
              aria-label={label}
              rows={4}
              maxLength={max}
              value={current}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <Input aria-label={label} maxLength={max} value={current} onChange={(e) => onChange(e.target.value)} />
          )}
          {max === undefined ? null : (
            <span className="text-muted-foreground text-xs tabular-nums">
              {current.length} / {max}
            </span>
          )}
        </div>
      )
    }
    case "number":
    case "scale":
      return <NumberInput label={label} value={value} onChange={onChange} />
    case "range": {
      const [low, high] = Array.isArray(value) ? (value as unknown[]) : []
      const set = (index: number) => (next: number | null) => {
        const pair = [low, high] as (number | null | undefined)[]
        pair[index] = next
        onChange(pair.every((item) => typeof item === "number") ? (pair as number[]) : null)
      }
      return (
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label={t("rangeFrom")} value={low} onChange={set(0)} />
          <NumberInput label={t("rangeTo")} value={high} onChange={set(1)} />
        </div>
      )
    }
    case "country":
    case "combobox":
      return (
        <TagInput
          aria-label={label}
          value={asStrings(value)}
          max={question.max_choices ?? undefined}
          placeholder={t("tagPlaceholder")}
          removeLabel={(tag) => t("removeTag", { tag })}
          onChange={onChange}
        />
      )
    case "date":
      return (
        <Input
          type="date"
          aria-label={label}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case "locked":
      return (
        <p className="flex items-center gap-2 text-sm">
          <Icons.lock className="size-4" aria-hidden />
          {value === undefined || value === null ? "—" : String(value)}
        </p>
      )
  }
}

/** Marks an answer that came from the lyceum record. */
export function PrefillBadge({ question }: { question: Question }) {
  const t = useT("profile")
  const source = question.prefill_source
  if (source !== "emis" && source !== "emis_locked" && source !== "academic_gpa") return null
  return (
    <Pill tone="primary" className="self-start">
      <Icons.lock className="size-3" aria-hidden />
      {t("fromRecord")}
    </Pill>
  )
}
