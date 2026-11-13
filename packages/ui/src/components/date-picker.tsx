"use client"

import { useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { useEffect, useState } from "react"
import { enUS, ru, uz } from "react-day-picker/locale"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

function toLocalDate(date: IsoDate): Date {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const pad = (value: number) => String(value).padStart(2, "0")

function toIso(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const CALENDAR_LOCALES = { en: enUS, ru, uz } as const

/** `YYYY-MM-DD` as the typed `DD.MM.YYYY`. */
const toTyped = (date: IsoDate) => {
  const [year = "", month = "", day = ""] = date.split("-")
  return `${day}.${month}.${year}`
}

/** Keeps the digits (a numeric keypad has no dot) and sets the dots of `DD.MM.YYYY` itself. */
function maskTyped(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

/** A complete, real calendar date within `min`/`max`, or null. */
function parseTyped(text: string, min?: IsoDate, max?: IsoDate): IsoDate | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text)
  if (!match) return null
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  const iso = toIso(date)
  if ((min && iso < min) || (max && iso > max)) return null
  return iso
}

/**
 * Single date as `YYYY-MM-DD` (the API's date format), shown in the user's language. `yearDropdown` shows month and
 * year selects bounded by `min`/`max`, for dates far from today such as a date of birth; `defaultMonth` is the month
 * the calendar opens on while nothing is chosen. `typed` adds a `DD.MM.YYYY` field beside the calendar button, kept in
 * sync with it; `required` stops a second click on the chosen day from clearing it; `closeOnSelect` closes the
 * calendar after a pick.
 */
export function DatePicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled,
  id,
  className,
  yearDropdown = false,
  defaultMonth,
  typed = false,
  required = false,
  closeOnSelect = false,
  "aria-label": ariaLabel,
}: {
  value: IsoDate | null | undefined
  onChange: (date: IsoDate | null) => void
  placeholder?: string
  min?: IsoDate
  max?: IsoDate
  disabled?: boolean
  id?: string
  className?: string
  yearDropdown?: boolean
  defaultMonth?: IsoDate
  typed?: boolean
  required?: boolean
  closeOnSelect?: boolean
  "aria-label"?: string
}) {
  const t = useT()
  const f = useFormatters()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(value ? toTyped(value) : "")
  const [blurred, setBlurred] = useState(false)

  // A pick in the calendar (or a reset by the form) rewrites the field; typing that produced `value` is left alone.
  useEffect(() => {
    if (value && parseTyped(text, min, max) !== value) setText(toTyped(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a changed value rewrites the text
  }, [value])

  const invalid = typed && text !== "" && parseTyped(text, min, max) === null && (blurred || text.length === 10)
  const calendarProps = {
    mode: "single" as const,
    selected: value ? toLocalDate(value) : undefined,
    disabled: [...(min ? [{ before: toLocalDate(min) }] : []), ...(max ? [{ after: toLocalDate(max) }] : [])],
    locale: CALENDAR_LOCALES[f.locale],
    weekStartsOn: 1 as const,
    autoFocus: true,
    className: "[--cell-size:--spacing(11)] md:[--cell-size:--spacing(7)]",
    ...(yearDropdown ? { captionLayout: "dropdown" as const } : {}),
    ...(min ? { startMonth: toLocalDate(min) } : {}),
    ...(max ? { endMonth: toLocalDate(max) } : {}),
    ...((value ?? defaultMonth) ? { defaultMonth: toLocalDate((value ?? defaultMonth) as IsoDate) } : {}),
  }
  const pick = (date: IsoDate | null) => {
    onChange(date)
    if (date && closeOnSelect) setOpen(false)
  }
  return (
    <div className={cn(typed && "flex items-center gap-2")}>
      {typed ? (
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD.MM.YYYY"
          maxLength={10}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={text}
          className="min-h-11 flex-1 md:min-h-8"
          onBlur={() => setBlurred(true)}
          onChange={(event) => {
            const next = maskTyped(event.target.value)
            setText(next)
            setBlurred(false)
            const date = parseTyped(next, min, max)
            if (date) onChange(date)
            else if (value) onChange(null)
          }}
        />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={typed ? undefined : id}
              variant="outline"
              disabled={disabled}
              aria-label={typed ? t("calendar.pickDate") : ariaLabel}
              className={cn(
                typed
                  ? "size-11 shrink-0 p-0 md:size-8"
                  : cn(
                      "min-h-11 w-full justify-start text-left font-normal md:min-h-8",
                      !value && "text-muted-foreground",
                    ),
                className,
              )}
            />
          }
        >
          <Icons.calendar className={cn("size-4", !typed && "mr-2")} aria-hidden />
          {typed ? null : value ? f.date(value) : (placeholder ?? t("calendar.pickDate"))}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {required ? (
            <Calendar {...calendarProps} required onSelect={(date: Date) => pick(toIso(date))} />
          ) : (
            <Calendar {...calendarProps} onSelect={(date: Date | undefined) => pick(date ? toIso(date) : null)} />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
