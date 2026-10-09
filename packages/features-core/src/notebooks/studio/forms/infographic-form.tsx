"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { INFOGRAPHIC_DETAILS, INFOGRAPHIC_STYLES, ORIENTATIONS, type InfographicState } from "./form-state"

/** Infographic: orientation, detail and one of the five themes. */
export function InfographicForm({ state, onChange }: FormProps<InfographicState>) {
  const t = useT("notebooks.opt")
  return (
    <>
      <SegmentedField
        label={t("orientation.label")}
        value={state.orientation}
        options={ORIENTATIONS.map((value) => ({ value, label: t(`orientation.${value}`) }))}
        onChange={(orientation) => onChange({ ...state, orientation })}
      />
      <SegmentedField
        label={t("detail.label")}
        value={state.detail}
        options={INFOGRAPHIC_DETAILS.map((value) => ({ value, label: t(`infoDetail.${value}`) }))}
        onChange={(detail) => onChange({ ...state, detail })}
      />
      <SegmentedField
        label={t("style.label")}
        value={state.style}
        options={INFOGRAPHIC_STYLES.map((value) => ({ value, label: t(`infoStyle.${value}`) }))}
        onChange={(style) => onChange({ ...state, style })}
      />
    </>
  )
}
