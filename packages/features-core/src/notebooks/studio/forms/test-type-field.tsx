"use client"

import { useT } from "@ihsp/i18n"
import { Dropdown, Label } from "@ihsp/ui"
import { useId } from "react"
import { TEST_MODES, type TestMode } from "./form-state"

export type TestTypeFieldProps = {
  value: TestMode
  onChange: (value: TestMode) => void
}

/** "Test type": Auto (recommended, the server picks from the sources) or one of the assessment modes. */
export function TestTypeField({ value, onChange }: TestTypeFieldProps) {
  const t = useT("notebooks.opt")
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t("mode.label")}</Label>
      <Dropdown
        id={id}
        value={value}
        className="w-full"
        onValueChange={(next) => {
          const chosen = TEST_MODES.find((mode) => mode === next)
          if (chosen) onChange(chosen)
        }}
        options={TEST_MODES.map((mode) => ({ value: mode, label: t(`mode.${mode}`) }))}
      />
    </div>
  )
}
