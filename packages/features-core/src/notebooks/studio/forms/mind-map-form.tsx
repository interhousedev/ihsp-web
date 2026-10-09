"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { MAP_DETAILS, type MindMapState } from "./form-state"

/** Mind map: Overview or Detailed. */
export function MindMapForm({ state, onChange }: FormProps<MindMapState>) {
  const t = useT("notebooks.opt")
  return (
    <SegmentedField
      label={t("detail.label")}
      value={state.detail}
      options={MAP_DETAILS.map((value) => ({ value, label: t(`mapDetail.${value}`) }))}
      onChange={(detail) => onChange({ ...state, detail })}
    />
  )
}
