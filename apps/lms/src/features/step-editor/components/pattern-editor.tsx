"use client"

import { useT } from "@ihsp/i18n"
import { Dropdown, Field, FieldDescription, FieldLabel, Input } from "@ihsp/ui"
import { useId, useState } from "react"
import { buildPattern, parsePattern, type PatternMode } from "../utils/answer-pattern"

type Mode = PatternMode | "off"

function initial(regex: string | null | undefined): { mode: Mode; text: string } {
  if (!regex) return { mode: "off", text: "" }
  const parsed = parsePattern(regex)
  return parsed ?? { mode: "advanced", text: regex }
}

function pattern(mode: Mode, text: string): string | null {
  if (mode === "off" || text === "") return null
  return mode === "advanced" ? text : buildPattern(mode, text)
}

/**
 * An optional extra rule of a text answer: exact text, contains, starts or ends with. The expression is generated;
 * a hand-written regular expression is only behind "advanced". Case is controlled by the caller's checkbox.
 */
export function PatternEditor({
  regex,
  onChange,
  label,
  ignoreCase,
  onIgnoreCaseChange,
  className = "",
}: {
  regex: string | null | undefined
  onChange: (regex: string | null) => void
  label: string
  /** Case is ignored (the inverse of the answer's `case_sensitive`). */
  ignoreCase: boolean
  onIgnoreCaseChange: (ignoreCase: boolean) => void
  className?: string
}) {
  const t = useT("testBuilder")
  const id = useId()
  const [state, setState] = useState(() => initial(regex))
  const { mode, text } = state

  function update(next: { mode: Mode; text: string }) {
    setState(next)
    onChange(pattern(next.mode, next.text))
  }

  function changeMode(value: string) {
    const next = (["exact", "contains", "startsWith", "endsWith", "advanced"].includes(value) ? value : "off") as Mode
    if (next === "off") return update({ mode: next, text: "" })
    if (next === "advanced") return update({ mode: next, text: pattern(mode, text) ?? "" })
    const parsed = mode === "advanced" ? parsePattern(text) : { text }
    update({ mode: next, text: parsed?.text ?? "" })
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Field>
        <FieldLabel htmlFor={`${id}-mode`}>{label}</FieldLabel>
        <Dropdown
          id={`${id}-mode`}
          value={mode}
          onValueChange={changeMode}
          className="w-full"
          options={[
            { value: "off", label: t("patternOff") },
            { value: "exact", label: t("patternExact") },
            { value: "contains", label: t("patternContains") },
            { value: "startsWith", label: t("patternStartsWith") },
            { value: "endsWith", label: t("patternEndsWith") },
            { value: "advanced", label: t("patternAdvanced") },
          ]}
        />
      </Field>
      {mode === "off" ? null : (
        <Field>
          <FieldLabel htmlFor={`${id}-text`}>{mode === "advanced" ? t("patternRegex") : t("patternText")}</FieldLabel>
          <Input
            id={`${id}-text`}
            value={text}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => update({ mode, text: event.target.value })}
            className={`h-11 md:h-8 ${mode === "advanced" ? "font-mono" : ""}`}
          />
          {mode === "advanced" ? <FieldDescription>{t("regexHint")}</FieldDescription> : null}
        </Field>
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
        <input
          type="checkbox"
          checked={ignoreCase}
          onChange={(event) => onIgnoreCaseChange(event.target.checked)}
          className="accent-primary size-4"
        />
        {t("patternIgnoreCase")}
      </label>
    </div>
  )
}
