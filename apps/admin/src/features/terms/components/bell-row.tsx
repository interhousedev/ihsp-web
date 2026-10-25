"use client"

import type { Bell } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  Input,
  Toggle,
} from "@ihsp/ui"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { EmisBadge } from "./emis-badge"

/**
 * One bell on one line: period, start, end, the weekday chips and a menu. Every field is editable: changing an EMIS
 * period turns it into an override (see `BellsEditor`), which shows an "Edited" badge; the menu resets it to EMIS
 * (override rows) or removes the row (rows by hand). The period number of an EMIS period is fixed.
 */
export function BellRow({
  bell,
  onChange,
  onReset,
  onRemove,
}: {
  bell: Bell
  onChange: (patch: Partial<Bell>) => void
  onReset: () => void
  onRemove: () => void
}) {
  const t = useT("terms.bells")
  const f = useFormatters()
  const fromEmis = bell.source !== "manual"
  const canReset = bell.source === "override" && Boolean(bell.emis_start && bell.emis_end)

  function toggleWeekday(weekday: number) {
    const weekdays = bell.weekdays.includes(weekday)
      ? bell.weekdays.filter((day) => day !== weekday)
      : [...bell.weekdays, weekday].toSorted()
    onChange({ weekdays })
  }

  return (
    <li className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-lg border p-2">
      <label className="flex w-16 flex-col gap-1 text-xs font-medium">
        {t("period")}
        <Input
          type="number"
          min={1}
          max={12}
          value={bell.period}
          disabled={fromEmis}
          className={TOUCH}
          onChange={(event) => onChange({ period: Number(event.target.value) || 0 })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        {t("start")}
        <Input
          type="time"
          value={bell.start}
          className={TOUCH}
          onChange={(event) => onChange({ start: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        {t("end")}
        <Input
          type="time"
          value={bell.end}
          className={TOUCH}
          onChange={(event) => onChange({ end: event.target.value })}
        />
      </label>
      <div role="group" aria-label={t("weekdays", { period: bell.period })} className="flex flex-wrap gap-1">
        {STUDY_WEEKDAYS.map((weekday) => {
          const on = bell.weekdays.includes(weekday)
          return (
            <Toggle
              key={weekday}
              size="sm"
              variant="outline"
              pressed={on}
              onPressedChange={() => toggleWeekday(weekday)}
              className="min-h-11 min-w-11 md:min-h-8 md:min-w-9 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 text-muted-foreground"
            >
              {f.weekday(weekdayDate(weekday), "short")}
            </Toggle>
          )
        })}
      </div>
      <div className="ms-auto flex items-center gap-1">
        {bell.source === "emis" ? <EmisBadge /> : null}
        {bell.source === "override" ? (
          <Badge
            variant="secondary"
            title={t("overriddenHint", { start: bell.emis_start ?? "", end: bell.emis_end ?? "" })}
          >
            {t("overridden")}
          </Badge>
        ) : null}
        {canReset || !fromEmis ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH_ICON}
                  aria-label={t("rowMenu", { period: bell.period })}
                />
              }
            >
              <Icons.moreHorizontal aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canReset ? (
                <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={onReset}>
                  {t("reset")}
                </DropdownMenuItem>
              ) : null}
              {!fromEmis ? (
                <DropdownMenuItem variant="destructive" className="min-h-11 md:min-h-8" onClick={onRemove}>
                  {t("remove", { period: bell.period })}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  )
}
