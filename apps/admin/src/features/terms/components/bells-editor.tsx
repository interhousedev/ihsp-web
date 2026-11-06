"use client"

import type { Bell } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { TOUCH } from "../../shared/utils/touch"
import { ALL_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { copyDayBlocks, dayBlocks, resetPeriodToEmis, setDayBlocks, type DayBlock } from "../utils/day-blocks"
import { BellRow } from "./bell-row"

/**
 * The lesson blocks of each weekday, one day at a time, Saturday and Sunday included (ACA-4). Lesson 2 may be 10:10 on
 * Monday and 11:00 on Tuesday. A day can start as a copy of another day. Changing a day on a period from EMIS makes
 * the period an override that the sync leaves alone; the row menu resets it. A weekend day without blocks is closed.
 */
export function BellsEditor({ bells, onChange }: { bells: Bell[]; onChange: (bells: Bell[]) => void }) {
  const t = useT("terms.bells")
  const f = useFormatters()
  const [day, setDay] = useState(1)
  const blocks = dayBlocks(bells, day)
  const dayName = (weekday: number) => f.weekday(weekdayDate(weekday), "long")
  const write = (next: DayBlock[]) => onChange(setDayBlocks(bells, day, next))

  function add() {
    const period = blocks.reduce((max, block) => Math.max(max, block.period), 0) + 1
    write([...blocks, { period, start: "", end: "", source: "manual" }])
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={t("days")} className="flex flex-wrap gap-1">
        {ALL_WEEKDAYS.map((weekday) => (
          <Button
            key={weekday}
            type="button"
            size="sm"
            variant={weekday === day ? "default" : "outline"}
            aria-pressed={weekday === day}
            aria-label={dayName(weekday)}
            className="min-h-11 min-w-11 md:min-h-8"
            onClick={() => setDay(weekday)}
          >
            {f.weekday(weekdayDate(weekday), "short")}
            <span className="text-xs opacity-70">{dayBlocks(bells, weekday).length}</span>
          </Button>
        ))}
      </div>

      {blocks.length === 0 ? <p className="text-muted-foreground text-sm">{t("emptyDay")}</p> : null}
      <ul className="flex flex-col gap-2">
        {blocks.map((block, index) => (
          <BellRow
            key={index}
            block={block}
            onChange={(patch) => write(blocks.map((item, at) => (at === index ? { ...item, ...patch } : item)))}
            onReset={() => onChange(resetPeriodToEmis(bells, block.period))}
            onRemove={() => write(blocks.filter((_, at) => at !== index))}
          />
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-3">
        <Button type="button" variant="outline" className={TOUCH} onClick={add}>
          <Icons.add aria-hidden />
          {t("add")}
        </Button>
        <label className="flex min-w-48 flex-col gap-1 text-xs font-medium">
          {t("copyFrom")}
          <SelectField
            id="bells-copy-from"
            value=""
            options={ALL_WEEKDAYS.filter((weekday) => weekday !== day).map((weekday) => ({
              value: String(weekday),
              label: dayName(weekday),
            }))}
            onChange={(value) => onChange(copyDayBlocks(bells, Number(value), day))}
          />
        </label>
      </div>
    </div>
  )
}
