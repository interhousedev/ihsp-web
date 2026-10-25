"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { SLIDES_FORMATS, SLIDES_LENGTHS, type SlidesState } from "./form-state"

/** Slide deck: Presenter slides or Detailed deck, and the length (Short / Default / Long). */
export function SlidesForm({ state, onChange }: FormProps<SlidesState>) {
  const t = useT("notebooks.opt")
  return (
    <>
      <SegmentedField
        label={t("slidesFormat.label")}
        value={state.format}
        options={SLIDES_FORMATS.map((value) => ({ value, label: t(`slidesFormat.${value}`) }))}
        onChange={(format) => onChange({ ...state, format })}
      />
      <SegmentedField
        label={t("length.label")}
        value={state.length}
        options={SLIDES_LENGTHS.map((value) => ({ value, label: t(`length.${value}`) }))}
        onChange={(length) => onChange({ ...state, length })}
      />
    </>
  )
}
