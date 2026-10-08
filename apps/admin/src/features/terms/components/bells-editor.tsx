"use client"

import type { Bell } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { STUDY_WEEKDAYS } from "../../shared/utils/weekdays"
import { TOUCH } from "../../shared/utils/touch"
import { BellRow } from "./bell-row"

/**
 * Periods with start and end times and the weekdays they apply to. A different time on Saturday is a second row
 * with the same period number and only Saturday selected (ACA-4). Bells that the EMIS class-hours sync set are
 * read-only (see `BellRow`); bells set by hand stay editable and new ones are always by hand.
 */
export function BellsEditor({ bells, onChange }: { bells: Bell[]; onChange: (bells: Bell[]) => void }) {
  const t = useT("terms.bells")

  function update(index: number, patch: Partial<Bell>) {
    onChange(bells.map((bell, position) => (position === index ? { ...bell, ...patch } : bell)))
  }

  function add() {
    const next = bells.reduce((max, bell) => Math.max(max, bell.period), 0) + 1
    onChange([...bells, { period: next, start: "", end: "", weekdays: [...STUDY_WEEKDAYS], source: "manual" }])
  }

  return (
    <div className="flex flex-col gap-3">
      {bells.some((bell) => bell.source === "emis") ? (
        <p className="text-muted-foreground text-xs">{t("emisNote")}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {bells.map((bell, index) => (
          <BellRow
            key={index}
            bell={bell}
            onChange={(patch) => update(index, patch)}
            onRemove={() => onChange(bells.filter((_, position) => position !== index))}
          />
        ))}
      </ul>
      <div>
        <Button type="button" variant="outline" className={TOUCH} onClick={add}>
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
      </div>
    </div>
  )
}
