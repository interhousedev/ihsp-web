"use client"

import { useT } from "@ihsp/i18n"
import type { FormProps } from "./form-props"
import { SegmentedField } from "./segmented-field"
import { REPORT_DETAILS, REPORT_STYLES, type ReportState } from "./form-state"

/** Report: detail (Short / Standard / Long) and, for a conspect only, the style. The format comes from the picker. */
export function ReportForm({ state, onChange }: FormProps<ReportState>) {
  const t = useT("notebooks.opt")
  return (
    <>
      <SegmentedField
        label={t("detail.label")}
        value={state.detail}
        options={REPORT_DETAILS.map((value) => ({ value, label: t(`detail.${value}`) }))}
        onChange={(detail) => onChange({ ...state, detail })}
      />
      {state.format === "conspect" ? (
        <SegmentedField
          label={t("style.label")}
          value={state.style}
          options={REPORT_STYLES.map((value) => ({ value, label: t(`style.${value}`) }))}
          onChange={(style) => onChange({ ...state, style })}
        />
      ) : null}
    </>
  )
}
