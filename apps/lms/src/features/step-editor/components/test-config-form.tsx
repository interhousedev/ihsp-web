"use client"

import type { TestConfig } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Field, FieldLabel, NativeSelect, NativeSelectOption, Switch } from "@ihsp/ui"
import { useId } from "react"
import { minutesToSeconds, secondsToMinutes } from "../../shared/utils/time"
import { SHOW_ANSWERS } from "../utils/content-ops"
import { NullableNumberInput } from "./nullable-number-input"

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  )
}

/** Test settings (LMS-16): attempts, passing score, shuffling, pool, time limit, pause, when answers are shown. */
export function TestConfigForm({ config, onChange }: { config: TestConfig; onChange: (config: TestConfig) => void }) {
  const t = useT("testBuilder")
  const showId = useId()
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{t("settings")}</legend>
      <NullableNumberInput
        label={t("maxAttempts")}
        value={config.max_attempts}
        min={1}
        onChange={(max_attempts) => onChange({ ...config, max_attempts })}
      />
      <NullableNumberInput
        label={t("passingScore")}
        value={config.passing_score_pct}
        min={0}
        max={100}
        onChange={(value) => onChange({ ...config, passing_score_pct: value ?? 0 })}
      />
      <NullableNumberInput
        label={t("poolSize")}
        value={config.pool_size}
        min={1}
        onChange={(pool_size) => onChange({ ...config, pool_size })}
      />
      <NullableNumberInput
        label={t("timeLimit")}
        value={secondsToMinutes(config.time_limit_sec)}
        min={1}
        onChange={(minutes) => onChange({ ...config, time_limit_sec: minutesToSeconds(minutes) })}
      />
      <NullableNumberInput
        label={t("cooldown")}
        value={secondsToMinutes(config.cooldown_sec)}
        min={0}
        onChange={(minutes) => onChange({ ...config, cooldown_sec: minutesToSeconds(minutes) })}
      />
      <Field>
        <FieldLabel htmlFor={showId}>{t("showAnswers")}</FieldLabel>
        <NativeSelect
          id={showId}
          value={config.show_answers}
          onChange={(event) => {
            const next = SHOW_ANSWERS.find((item) => item === event.target.value)
            if (next) onChange({ ...config, show_answers: next })
          }}
          className="w-full"
        >
          {SHOW_ANSWERS.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {t(`showAnswersOptions.${item}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <SwitchField
        label={t("shuffleQuestions")}
        checked={config.shuffle_questions}
        onChange={(shuffle_questions) => onChange({ ...config, shuffle_questions })}
      />
      <SwitchField
        label={t("shuffleOptions")}
        checked={config.shuffle_options}
        onChange={(shuffle_options) => onChange({ ...config, shuffle_options })}
      />
    </fieldset>
  )
}
