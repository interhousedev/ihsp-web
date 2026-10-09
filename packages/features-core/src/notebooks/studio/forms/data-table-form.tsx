"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label } from "@ihsp/ui"
import { useId } from "react"
import type { FormProps } from "./form-props"
import { MAX_ROWS, MIN_ROWS, type DataTableState } from "./form-state"

/** Data table: the maximum number of rows (10 to 40). The focus text names the columns. */
export function DataTableForm({ state, onChange }: FormProps<DataTableState>) {
  const t = useT("notebooks.opt")
  const id = useId()
  const hintId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t("maxRows.label")}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={MIN_ROWS}
        max={MAX_ROWS}
        step={1}
        value={state.maxRows}
        aria-describedby={hintId}
        className="min-h-11 w-28 md:min-h-8"
        onChange={(event) => onChange({ ...state, maxRows: event.target.value })}
      />
      <p id={hintId} className="text-muted-foreground text-xs">
        {t("maxRows.hint")}
      </p>
    </div>
  )
}
