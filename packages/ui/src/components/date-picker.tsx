"use client"

import { useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

function toLocalDate(date: IsoDate): Date {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const pad = (value: number) => String(value).padStart(2, "0")

function toIso(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Single date as `YYYY-MM-DD` (the API's date format), shown in the user's language. */
export function DatePicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled,
  id,
  className,
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
  "aria-label"?: string
}) {
  const t = useT()
  const f = useFormatters()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "min-h-11 w-full justify-start text-left font-normal md:min-h-8",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <Icons.calendar className="mr-2 size-4" aria-hidden />
        {value ? f.date(value) : (placeholder ?? t("calendar.pickDate"))}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? toLocalDate(value) : undefined}
          onSelect={(date) => onChange(date ? toIso(date) : null)}
          disabled={[...(min ? [{ before: toLocalDate(min) }] : []), ...(max ? [{ after: toLocalDate(max) }] : [])]}
          weekStartsOn={1}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
