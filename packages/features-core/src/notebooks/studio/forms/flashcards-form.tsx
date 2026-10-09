"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { COUNTS, LEVELS, type FlashcardsState } from "./form-state"

/** Flash cards: number (Fewer / Standard / More) and difficulty. */
export function FlashcardsForm({ state, onChange }: FormProps<FlashcardsState>) {
  const t = useT("notebooks.opt")
  return (
    <>
      <SegmentedField
        label={t("count.label")}
        value={state.count}
        options={COUNTS.map((value) => ({ value, label: t(`count.${value}`) }))}
        onChange={(count) => onChange({ ...state, count })}
      />
      <SegmentedField
        label={t("difficulty.label")}
        value={state.difficulty}
        options={LEVELS.map((value) => ({ value, label: t(`difficulty.${value}`) }))}
        onChange={(difficulty) => onChange({ ...state, difficulty })}
      />
    </>
  )
}
