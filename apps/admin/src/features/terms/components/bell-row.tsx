"use client"

import type { Bell } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { EmisBadge } from "./emis-badge"

/**
 * One bell: period, start, end and the weekdays it applies to. A bell from the EMIS sync (`source: "emis"`) shows the
 * EMIS badge instead of the remove button and every control is disabled, because the sync keeps it equal to EMIS.
 */
export function BellRow({
  bell,
  onChange,
  onRemove,
}: {
  bell: Bell
  onChange: (patch: Partial<Bell>) => void
  onRemove: () => void
}) {
  const t = useT("terms.bells")
  const f = useFormatters()
  const readOnly = bell.source === "emis"

  function toggleWeekday(weekday: number) {
    const weekdays = bell.weekdays.includes(weekday)
      ? bell.weekdays.filter((day) => day !== weekday)
      : [...bell.weekdays, weekday].toSorted()
    onChange({ weekdays })
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex w-20 flex-col gap-1 text-xs font-medium">
          {t("period")}
          <Input
            type="number"
            min={1}
            max={12}
            value={bell.period}
            disabled={readOnly}
            className={TOUCH}
            onChange={(event) => onChange({ period: Number(event.target.value) || 0 })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("start")}
          <Input
            type="time"
            value={bell.start}
            disabled={readOnly}
            className={TOUCH}
            onChange={(event) => onChange({ start: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("end")}
          <Input
            type="time"
            value={bell.end}
            disabled={readOnly}
            className={TOUCH}
            onChange={(event) => onChange({ end: event.target.value })}
          />
        </label>
        {readOnly ? (
          <span className="ms-auto flex min-h-11 items-center md:min-h-8">
            <EmisBadge />
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${TOUCH_ICON} ms-auto`}
            aria-label={t("remove", { period: bell.period })}
            onClick={onRemove}
          >
            <Icons.trash aria-hidden />
          </Button>
        )}
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
              disabled={readOnly}
              className="min-h-11 min-w-11 md:min-h-7 md:min-w-0"
              onClick={() => toggleWeekday(weekday)}
            >
              {f.weekday(weekdayDate(weekday), "short")}
            </Button>
          )
        })}
      </div>
    </li>
  )
}
