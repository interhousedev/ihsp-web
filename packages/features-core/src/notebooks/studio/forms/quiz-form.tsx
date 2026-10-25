"use client"

import { useT } from "@ihsp/i18n"
import { Checkbox } from "@ihsp/ui"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { CountField } from "./count-field"
import { TestTypeField } from "./test-type-field"
import { EXACT_COUNT_LIMITS, LEVELS, QUIZ_TYPES, type QuizState, type QuizType } from "./form-state"

/** Quiz: number, difficulty and the question types (at least one). */
export function QuizForm({ state, onChange }: FormProps<QuizState>) {
  const t = useT("notebooks.opt")
  const toggle = (type: QuizType, checked: boolean) =>
    onChange({
      ...state,
      types: checked
        ? QUIZ_TYPES.filter((entry) => entry === type || state.types.includes(entry))
        : state.types.filter((entry) => entry !== type),
    })
  const none = state.types.length === 0

  return (
    <>
      <CountField
        state={state}
        onChange={(count) => onChange({ ...state, ...count })}
        limits={EXACT_COUNT_LIMITS.quiz}
        customLabelKey="count.customQuestions"
      />
      <TestTypeField value={state.mode} onChange={(mode) => onChange({ ...state, mode })} />
      <SegmentedField
        label={t("difficulty.label")}
        value={state.difficulty}
        options={LEVELS.map((value) => ({ value, label: t(`difficulty.${value}`) }))}
        onChange={(difficulty) => onChange({ ...state, difficulty })}
      />
      <fieldset className="flex min-w-0 flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t("types.label")}</legend>
        <div className="flex flex-wrap gap-x-4">
          {QUIZ_TYPES.map((type) => (
            <label key={type} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              {/* No aria-label: the wrapping <label> names the checkbox. */}
              <Checkbox checked={state.types.includes(type)} onCheckedChange={(checked) => toggle(type, checked)} />
              <span>{t(`types.${type}`)}</span>
            </label>
          ))}
        </div>
        {none ? (
          <p role="alert" className="text-destructive text-xs">
            {t("types.hint")}
          </p>
        ) : null}
      </fieldset>
    </>
  )
}
