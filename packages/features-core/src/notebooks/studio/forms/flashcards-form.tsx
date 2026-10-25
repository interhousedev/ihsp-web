"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { CountField } from "./count-field"
import { EXACT_COUNT_LIMITS, LEVELS, type FlashcardsState } from "./form-state"
import { SegmentedField } from "./segmented-field"
import { TestTypeField } from "./test-type-field"

/** Flash cards: number (Fewer / Standard / More / Custom) and difficulty. */
export function FlashcardsForm({ state, onChange }: FormProps<FlashcardsState>) {
  const t = useT("notebooks.opt")
  return (
    <>
      <CountField
        state={state}
        onChange={(count) => onChange({ ...state, ...count })}
        limits={EXACT_COUNT_LIMITS.flashcards}
        customLabelKey="count.customCards"
      />
      <TestTypeField value={state.mode} onChange={(mode) => onChange({ ...state, mode })} />
      <SegmentedField
        label={t("difficulty.label")}
        value={state.difficulty}
        options={LEVELS.map((value) => ({ value, label: t(`difficulty.${value}`) }))}
        onChange={(difficulty) => onChange({ ...state, difficulty })}
      />
    </>
  )
}
