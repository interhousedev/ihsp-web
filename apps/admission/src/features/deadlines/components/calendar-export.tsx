"use client"

import { useErrorMessage, useFormatters, useLocale, useT } from "@ihsp/i18n"
import { Button, StateView } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { downloadCalendarIcs, EXPORT_MAX_KEYS, useCalendar } from "../calendar-api"

/** Downloads the calendar entries of the shown range as an .ics file, all of them or the ticked ones. */
export function CalendarExport({ from, to }: { from: string; to: string }) {
  const t = useT("deadlines")
  const locale = useLocale()
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const calendar = useCalendar(from, to)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const download = useMutation({
    mutationFn: (keys: string[] | null) => downloadCalendarIcs(keys ? { keys } : { from, to }, locale),
  })
  if (calendar.isPending) return <StateView state="loading" rows={1} />
  if (calendar.isError)
    return <StateView state="error" error={calendar.error} onRetry={() => void calendar.refetch()} />
  const items = calendar.data.items
  const full = picked.size >= EXPORT_MAX_KEYS
  const toggle = (key: string) =>
    setPicked((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  return (
    <section className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
      <h3 className="font-medium">{t("calendar.exportTitle")}</h3>
      <p className="text-muted-foreground text-sm">{t("calendar.exportHint")}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("calendar.exportEmpty")}</p>
      ) : (
        <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.key}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={picked.has(item.key)}
                  disabled={full && !picked.has(item.key)}
                  onChange={() => toggle(item.key)}
                />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="text-muted-foreground shrink-0">{date(`${item.day}T12:00:00+05:00`)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {full ? (
        <p className="text-muted-foreground text-xs">{t("calendar.exportLimit", { max: EXPORT_MAX_KEYS })}</p>
      ) : null}
      {download.error ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(download.error)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={download.isPending || items.length === 0}
          onClick={() => download.mutate(null)}
        >
          {t("calendar.exportAll")}
        </Button>
        <Button disabled={download.isPending || picked.size === 0} onClick={() => download.mutate([...picked])}>
          {t("calendar.exportSelected", { count: picked.size })}
        </Button>
      </div>
    </section>
  )
}
