"use client"

import type { PlannerMarkType } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Label, NativeSelect, NativeSelectOption } from "@ihsp/ui"
import { useId, useState } from "react"
import { PageSection } from "../../../exams/components/page-section"
import { usePlannerLabels } from "../hooks/use-planner-labels"
import { MAX_WHAT_IF, WHAT_IF_MARKS, WHAT_IF_TYPES, type WhatIfMark } from "../utils/what-if"
import { addWhatIf, canAddWhatIf, removeWhatIf } from "../utils/what-if-list"
import { WhatIfChips } from "./what-if-chips"

const SELECT_CLASS = "w-28 [&_select]:h-11 md:[&_select]:h-8"

/**
 * "Try other marks": pick a kind of mark and a mark from 2 to 5, add it, and the planner answers again as if it was
 * received. The marks are only held here (nothing is saved); each can be removed and "Reset" clears them all.
 */
export function WhatIfEditor({ marks, onChange }: { marks: WhatIfMark[]; onChange: (marks: WhatIfMark[]) => void }) {
  const t = useT("planner.whatIf")
  const labels = usePlannerLabels()
  const typeId = useId()
  const markId = useId()
  const [type, setType] = useState<PlannerMarkType>("midterm")
  const [value, setValue] = useState<number>(5)
  const canAdd = canAddWhatIf(marks)
  return (
    <PageSection
      title={t("title")}
      hint={t("hint")}
      action={
        <Button
          type="button"
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={marks.length === 0}
          onClick={() => onChange([])}
        >
          {t("reset")}
        </Button>
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={typeId}>{t("typeLabel")}</Label>
          <NativeSelect
            id={typeId}
            className={SELECT_CLASS}
            value={type}
            onChange={(event) => setType(event.target.value as PlannerMarkType)}
          >
            {WHAT_IF_TYPES.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {labels.tryType(option)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={markId}>{t("markLabel")}</Label>
          <NativeSelect
            id={markId}
            className={SELECT_CLASS}
            value={String(value)}
            onChange={(event) => setValue(Number(event.target.value))}
          >
            {WHAT_IF_MARKS.map((option) => (
              <NativeSelectOption key={option} value={String(option)}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button
          type="button"
          className="min-h-11 md:min-h-8"
          disabled={!canAdd}
          onClick={() => onChange(addWhatIf(marks, { type, value }))}
        >
          {t("add")}
        </Button>
      </div>
      {canAdd ? null : <p className="text-muted-foreground text-xs">{t("full", { max: MAX_WHAT_IF })}</p>}
      <WhatIfChips marks={marks} onRemove={(index) => onChange(removeWhatIf(marks, index))} />
    </PageSection>
  )
}
