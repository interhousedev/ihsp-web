"use client"

import { CountryFlag } from "./country-flag"
import { useLocale, useT } from "@ihsp/i18n"
import { useMemo, useRef } from "react"
import { ChoiceCard, ChoiceCardGroup, Icons, Input, Pill, TagInput, Textarea } from "@ihsp/ui"
import { useAdmissionConfig } from "../../../lib/config"
import { configOptions } from "../../chooser/config-options"
import type { AnswerValue, Question } from "../types"
import { useProfileText } from "../lib/use-profile-text"

type FieldProps = {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
  /** Reports whether a tag field holds typed text that is not a tag yet. */
  onDraft?: (typed: boolean) => void
}

const LONG_TEXT = 120

function asStrings(value: AnswerValue | undefined): string[] {
  return Array.isArray(value) ? (value as unknown[]).filter((item): item is string => typeof item === "string") : []
}

/** Countries (ISO codes, named by the browser in the UI language) or study fields; the lists come from the backend. */
function TagsField({ question, value, onChange, onDraft, label }: FieldProps & { label: string }) {
  const t = useT("profile")
  const locale = useLocale()
  const config = useAdmissionConfig()
  const options = useMemo(() => {
    if (question.kind === "country") {
      const names = new Intl.DisplayNames([locale], { type: "region" })
      const available = new Set(configOptions(config.data, "countries_available"))
      const known = Array.isArray(
        (config.data as { options?: Record<string, unknown> } | undefined)?.options?.countries_available,
      )
      return configOptions(config.data, "countries").map((code) => {
        const disabled = known && !available.has(code)
        return {
          value: code,
          label: names.of(code) ?? code,
          icon: <CountryFlag code={code} />,
          disabled,
          hint: disabled ? t("noUniversities") : undefined,
        }
      })
    }
    return configOptions(config.data, "fields").map((name) => ({ value: name, label: name }))
  }, [question.kind, config.data, locale, t])
  const draft = useRef("")
  const tags = asStrings(value)
  const max = question.max_choices ?? undefined

  /** Leaving the field adds the typed text when it names exactly one option, as Enter would. */
  function commitDraft() {
    const text = draft.current.trim().toLowerCase()
    draft.current = ""
    onDraft?.(false)
    if (!text || options.length === 0 || (max !== undefined && tags.length >= max)) return
    const free = options.filter((option) => !tags.includes(option.value))
    const found =
      free.find((option) => option.label.toLowerCase() === text) ??
      free.filter((option) => option.label.toLowerCase().includes(text))[0]
    if (found) onChange([...tags, found.value])
  }

  return (
    <div
      className="flex flex-col gap-1"
      onInput={(event) => {
        draft.current = (event.target as HTMLInputElement).value ?? ""
        onDraft?.(draft.current.trim() !== "")
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commitDraft()
      }}
    >
      <TagInput
        aria-label={label}
        value={tags}
        max={max}
        options={options.length > 0 ? options : undefined}
        placeholder={t("tagPlaceholder")}
        removeLabel={(tag) => t("removeTag", { tag })}
        onChange={(next) => {
          draft.current = ""
          onDraft?.(false)
          onChange(next)
        }}
      />
      <span className="text-muted-foreground text-xs">{t("tagHint")}</span>
    </div>
  )
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
            description={text.optionHint(option)}
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
      return <TagsField {...props} label={label} />
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
export function PrefillBadge({ question, answered }: { question: Question; answered: boolean }) {
  const t = useT("profile")
  const source = question.prefill_source
  if (!answered) return null
  if (source !== "emis" && source !== "emis_locked" && source !== "academic_gpa") return null
  return (
    <Pill tone="primary" className="self-start">
      <Icons.lock className="size-3" aria-hidden />
      {t("fromRecord")}
    </Pill>
  )
}
