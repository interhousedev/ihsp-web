"use client"

import type { Bell } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"

/**
 * Periods with start and end times and the weekdays they apply to. A different time on Saturday is a second row
 * with the same period number and only Saturday selected (ACA-4).
 */
export function BellsEditor({ bells, onChange }: { bells: Bell[]; onChange: (bells: Bell[]) => void }) {
  const t = useT("terms.bells")
  const f = useFormatters()

  function update(index: number, patch: Partial<Bell>) {
    onChange(bells.map((bell, position) => (position === index ? { ...bell, ...patch } : bell)))
  }

  function toggleWeekday(index: number, weekday: number) {
    const bell = bells[index]
    if (!bell) return
    const weekdays = bell.weekdays.includes(weekday)
      ? bell.weekdays.filter((day) => day !== weekday)
      : [...bell.weekdays, weekday].toSorted()
    update(index, { weekdays })
  }

  function add() {
    const next = bells.reduce((max, bell) => Math.max(max, bell.period), 0) + 1
    onChange([...bells, { period: next, start: "", end: "", weekdays: [...STUDY_WEEKDAYS] }])
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {bells.map((bell, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex w-20 flex-col gap-1 text-xs font-medium">
                {t("period")}
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={bell.period}
                  className={TOUCH}
                  onChange={(event) => update(index, { period: Number(event.target.value) || 0 })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                {t("start")}
                <Input
                  type="time"
                  value={bell.start}
                  className={TOUCH}
                  onChange={(event) => update(index, { start: event.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                {t("end")}
                <Input
                  type="time"
                  value={bell.end}
                  className={TOUCH}
                  onChange={(event) => update(index, { end: event.target.value })}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`${TOUCH_ICON} ms-auto`}
                aria-label={t("remove", { period: bell.period })}
                onClick={() => onChange(bells.filter((_, position) => position !== index))}
              >
                <Icons.trash aria-hidden />
              </Button>
            </div>
            <div role="group" aria-label={t("weekdays", { period: bell.period })} className="flex flex-wrap gap-1">
              {STUDY_WEEKDAYS.map((weekday) => {
                const on = bell.weekdays.includes(weekday)
                return (
                  <Button
                    key={weekday}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    aria-pressed={on}
                    className="min-h-11 min-w-11 md:min-h-7 md:min-w-0"
                    onClick={() => toggleWeekday(index, weekday)}
                  >
                    {f.weekday(weekdayDate(weekday), "short")}
                  </Button>
                )
              })}
            </div>
          </li>
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
