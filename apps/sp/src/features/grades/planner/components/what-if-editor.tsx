"use client"

import type { PlannerMarkType } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown, Label } from "@ihsp/ui"
import { useId, useState } from "react"
import { PageSection } from "../../../exams/components/page-section"
import { usePlannerLabels } from "../hooks/use-planner-labels"
import { WHAT_IF_MARKS, WHAT_IF_TYPES, type WhatIfMark } from "../utils/what-if"
import { addWhatIf, canAddWhatIf, removeWhatIf } from "../utils/what-if-list"
import { WhatIfChips } from "./what-if-chips"

const SELECT_CLASS = "w-28"

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
          <Dropdown
            id={typeId}
            className={SELECT_CLASS}
            value={type}
            onValueChange={(next) => setType(next as PlannerMarkType)}
            options={WHAT_IF_TYPES.map((option) => ({ value: option, label: labels.tryType(option) }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={markId}>{t("markLabel")}</Label>
          <Dropdown
            id={markId}
            className={SELECT_CLASS}
            value={String(value)}
            onValueChange={(next) => setValue(Number(next))}
            options={WHAT_IF_MARKS.map((option) => ({ value: String(option), label: String(option) }))}
          />
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
      <WhatIfChips marks={marks} onRemove={(index) => onChange(removeWhatIf(marks, index))} />
    </PageSection>
  )
}
