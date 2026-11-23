"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Input } from "@ihsp/ui"

/** A list of calendar dates picked with the native date control: add and remove rows. Empty rows are ignored on save. */
export function DateListField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string[]
  onChange: (dates: string[]) => void
}) {
  const t = useT("settingsUx")
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5 text-sm">
      <span>{label}</span>
      {value.map((date, i) => (
        <div key={i} className="flex gap-2">
          <Input
            type="date"
            className="min-h-11 md:min-h-8"
            aria-label={t("dateRow", { label, n: i + 1 })}
            value={date}
            onChange={(event) => onChange(value.map((d, j) => (j === i ? event.target.value : d)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
            aria-label={t("removeDate", { label, n: i + 1 })}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <Icons.trash className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 self-start md:min-h-8"
        onClick={() => onChange([...value, ""])}
      >
        {t("addDate")}
      </Button>
    </div>
  )
}

/** The picked dates, unique and in calendar order. */
export const cleanDates = (value: string[]): string[] => [...new Set(value.filter(Boolean))].toSorted()
