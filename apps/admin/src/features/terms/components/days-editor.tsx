"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, DatePicker, Icons } from "@ihsp/ui"
import { useState } from "react"
import { SelectField } from "../../shared/components/select-field"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"

type Moved = { date: string; follows_weekday: number }

/** Holidays (non-study days) and moved study days such as "Saturday 14.12 follows Monday" (ACA-4, ADM-18). */
export function DaysEditor({
  nonStudyDays,
  movedDays,
  onNonStudyChange,
  onMovedChange,
}: {
  nonStudyDays: string[]
  movedDays: Moved[]
  onNonStudyChange: (days: string[]) => void
  onMovedChange: (days: Moved[]) => void
}) {
  const t = useT("terms.days")
  const f = useFormatters()
  const [holiday, setHoliday] = useState<string | null>(null)
  const [movedDate, setMovedDate] = useState<string | null>(null)
  const [follows, setFollows] = useState("1")

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold">{t("nonStudy")}</h4>
        <ul className="flex flex-col gap-1">
          {nonStudyDays.map((day) => (
            <li key={day} className="flex items-center justify-between gap-2 rounded-md border px-3 py-1 text-sm">
              <span>{f.date(day, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={TOUCH_ICON}
                aria-label={t("removeDay", { date: f.date(day) })}
                onClick={() => onNonStudyChange(nonStudyDays.filter((item) => item !== day))}
              >
                <Icons.close aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <DatePicker
            value={holiday}
            onChange={setHoliday}
            aria-label={t("pickHoliday")}
            placeholder={t("pickHoliday")}
          />
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={holiday === null || nonStudyDays.includes(holiday)}
            onClick={() => {
              if (holiday) onNonStudyChange([...nonStudyDays, holiday].toSorted())
              setHoliday(null)
            }}
          >
            {t("addHoliday")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold">{t("moved")}</h4>
        <ul className="flex flex-col gap-1">
          {movedDays.map((day) => (
            <li key={day.date} className="flex items-center justify-between gap-2 rounded-md border px-3 py-1 text-sm">
              <span>
                {t("movedLine", {
                  date: f.date(day.date, { weekday: "short", day: "numeric", month: "long" }),
                  weekday: f.weekday(weekdayDate(day.follows_weekday), "long"),
                })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={TOUCH_ICON}
                aria-label={t("removeDay", { date: f.date(day.date) })}
                onClick={() => onMovedChange(movedDays.filter((item) => item.date !== day.date))}
              >
                <Icons.close aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            value={movedDate}
            onChange={setMovedDate}
            aria-label={t("pickMoved")}
            placeholder={t("pickMoved")}
          />
          <SelectField
            aria-label={t("follows")}
            className="w-40"
            value={follows}
            options={STUDY_WEEKDAYS.map((weekday) => ({
              value: String(weekday),
              label: f.weekday(weekdayDate(weekday), "long"),
            }))}
            onChange={setFollows}
          />
          <Button
            type="button"
            variant="outline"
            className={TOUCH}
            disabled={movedDate === null || movedDays.some((item) => item.date === movedDate)}
            onClick={() => {
              if (movedDate)
                onMovedChange(
                  [...movedDays, { date: movedDate, follows_weekday: Number(follows) }].toSorted((a, b) =>
                    a.date.localeCompare(b.date),
                  ),
                )
              setMovedDate(null)
            }}
          >
            {t("addMoved")}
          </Button>
        </div>
      </section>
    </div>
  )
}
