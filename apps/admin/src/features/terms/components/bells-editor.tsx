"use client"

import type { Bell } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { STUDY_WEEKDAYS } from "../../shared/utils/weekdays"
import { TOUCH } from "../../shared/utils/touch"
import { BellRow } from "./bell-row"

/**
 * Periods with start and end times and the weekdays they apply to. A different time on Saturday is a second row
 * with the same period number and only Saturday selected (ACA-4). EMIS times are the defaults: changing the time or
 * the weekdays of an EMIS period makes it an override (`source: "override"`) that the sync leaves alone, and the row
 * menu resets it to EMIS. New periods are always by hand.
 */
export function BellsEditor({ bells, onChange }: { bells: Bell[]; onChange: (bells: Bell[]) => void }) {
  const t = useT("terms.bells")

  function update(index: number, patch: Partial<Bell>) {
    onChange(
      bells.map((bell, position) => {
        if (position !== index) return bell
        // The first change of an EMIS period remembers what EMIS said, so it can be reset.
        if (bell.source === "emis") {
          return { ...bell, ...patch, source: "override", emis_start: bell.start, emis_end: bell.end }
        }
        return { ...bell, ...patch }
      }),
    )
  }

  function reset(index: number) {
    onChange(
      bells.map((bell, position) =>
        position === index && bell.emis_start && bell.emis_end
          ? {
              ...bell,
              start: bell.emis_start,
              end: bell.emis_end,
              weekdays: [...STUDY_WEEKDAYS],
              source: "emis",
              emis_start: null,
              emis_end: null,
            }
          : bell,
      ),
    )
  }

  function add() {
    const next = bells.reduce((max, bell) => Math.max(max, bell.period), 0) + 1
    onChange([...bells, { period: next, start: "", end: "", weekdays: [...STUDY_WEEKDAYS], source: "manual" }])
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {bells.map((bell, index) => (
          <BellRow
            key={index}
            bell={bell}
            onChange={(patch) => update(index, patch)}
            onReset={() => reset(index)}
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
