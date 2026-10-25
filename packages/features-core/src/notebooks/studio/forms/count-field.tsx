"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label } from "@ihsp/ui"
import { useId } from "react"
import { COUNT_CHOICES, exactCount, type CountChoice, type CountFields, type ExactCountLimits } from "./form-state"
import { SegmentedField } from "./segmented-field"

/** Number of the kind's items: the three presets, or "Custom" with a number input (min and max checked). */
export function CountField({
  state,
  onChange,
  limits,
  customLabelKey,
}: {
  state: CountFields
  onChange: (next: CountFields) => void
  limits: ExactCountLimits
  customLabelKey: "count.customCards" | "count.customQuestions"
}) {
  const t = useT("notebooks.opt")
  const inputId = useId()
  const errorId = useId()
  const invalid = state.count === "custom" && exactCount(state.customCount, limits) === null
  return (
    <>
      <SegmentedField
        label={t("count.label")}
        value={state.count}
        options={COUNT_CHOICES.map((value: CountChoice) => ({ value, label: t(`count.${value}`) }))}
        onChange={(count) => onChange({ ...state, count })}
      />
      {state.count === "custom" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={inputId}>{t(customLabelKey)}</Label>
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={limits.min}
            max={limits.max}
            step={1}
            required
            value={state.customCount}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            className="min-h-11 w-28 md:min-h-8"
            onChange={(event) => onChange({ ...state, customCount: event.target.value })}
          />
          {invalid ? (
            <p id={errorId} role="alert" className="text-destructive text-xs">
              {t("count.customRange", { min: limits.min, max: limits.max })}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
