"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { usePlannerLabels } from "../hooks/use-planner-labels"
import type { WhatIfMark } from "../utils/what-if"

/** The marks being tried out, each a chip with a remove button; the list is named for screen readers. */
export function WhatIfChips({ marks, onRemove }: { marks: WhatIfMark[]; onRemove: (index: number) => void }) {
  const t = useT("planner.whatIf")
  const labels = usePlannerLabels()
  if (marks.length === 0) return <p className="text-muted-foreground text-sm">{t("empty")}</p>
  return (
    <ul aria-label={t("list")} className="flex flex-wrap gap-2" data-testid="what-if-chips">
      {marks.map((mark, index) => {
        const text = t("item", { type: labels.tryType(mark.type), value: mark.value })
        return (
          // The same mark can be tried twice, so the position is the key.
          // oxlint-disable-next-line react/no-array-index-key
          <li key={index} className="flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3 text-sm">
            <span>{text}</span>
            <Button
              type="button"
              variant="ghost"
              className="size-9 rounded-full md:size-7"
              aria-label={t("remove", { type: labels.tryType(mark.type), value: mark.value })}
              onClick={() => onRemove(index)}
            >
              <Icons.close aria-hidden />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
