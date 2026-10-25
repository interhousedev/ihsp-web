"use client"

import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useId } from "react"
import type { FormProps } from "./form-props"
import { MAX_SECTIONS, MIN_SECTIONS, PLAN_DEPTHS, formProblem, type CoursePlanState } from "./form-state"
import { SegmentedField } from "./segmented-field"

/** Course plan: how detailed it is and, optionally, how many sections the author wants. */
export function CoursePlanForm({ state, onChange }: FormProps<CoursePlanState>) {
  const t = useT("notebooks.opt")
  const inputId = useId()
  const invalid = formProblem(state) === "sections-invalid"
  return (
    <>
      <SegmentedField
        label={t("planDepth.label")}
        value={state.depth}
        options={PLAN_DEPTHS.map((value) => ({ value, label: t(`planDepth.${value}`) }))}
        onChange={(depth) => onChange({ ...state, depth })}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium">
          {t("sectionsHint.label")}
        </label>
        <Input
          id={inputId}
          inputMode="numeric"
          className="min-h-11 md:min-h-8"
          placeholder={t("sectionsHint.placeholder")}
          value={state.sections}
          aria-invalid={invalid}
          onChange={(event) => onChange({ ...state, sections: event.target.value })}
        />
        {invalid ? (
          <p role="alert" className="text-destructive text-xs">
            {t("sectionsHint.hint", { min: MIN_SECTIONS, max: MAX_SECTIONS })}
          </p>
        ) : null}
      </div>
    </>
  )
}
