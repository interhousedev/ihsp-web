"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useCalendar } from "../calendar-api"
import { CalendarFeed } from "./calendar-feed"
import { PrefsForm } from "./prefs-form"

/** A month calendar and its dated agenda, merging every registered deadline source. */
export function CalendarView() {
  const t = useT("deadlines")
  const { date } = useFormatters()
  const [month, setMonth] = useState(() => {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date())
    return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [year, number] = month.split("-").map(Number)
  const days = new Date(Date.UTC(year!, number!, 0)).getUTCDate()
  const start = `${month}-01`
  const end = `${month}-${String(days).padStart(2, "0")}`
  const query = useCalendar(start, end)
  const items = query.data?.items ?? []
  const shown = selected ? items.filter((item) => item.day === selected) : items
  const shift = (delta: number) => {
    const next = new Date(Date.UTC(year!, number! - 1 + delta, 1))
    setMonth(next.toISOString().slice(0, 7))
    setSelected(null)
  }
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label={t("calendar.title")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("calendar.title")}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="min-h-11 min-w-11 md:min-h-9 md:min-w-9"
            onClick={() => shift(-1)}
            aria-label={t("calendar.previous")}
          >
            <Icons.chevronLeft aria-hidden />
          </Button>
          <span className="text-sm">{date(`${start}T12:00:00+05:00`, { month: "long", year: "numeric" })}</span>
          <Button
            variant="outline"
            size="icon"
            className="min-h-11 min-w-11 md:min-h-9 md:min-w-9"
            onClick={() => shift(1)}
            aria-label={t("calendar.next")}
          >
            <Icons.chevronRight aria-hidden />
          </Button>
        </div>
      </div>
      {query.isPending ? (
        <StateView state="loading" rows={3} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <div className="text-muted-foreground grid grid-cols-7 gap-1 text-center text-xs font-medium" aria-hidden>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="min-w-0 truncate">
                {date(`2024-01-0${i + 1}T12:00:00+05:00`, { weekday: "short" })}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days }, (_, i) => {
              const day = `${month}-${String(i + 1).padStart(2, "0")}`
              const count = items.filter((item) => item.day === day).length
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected === day}
                  aria-label={`${date(`${day}T12:00:00+05:00`)} · ${count}`}
                  onClick={() => setSelected(selected === day ? null : day)}
                  className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg border text-sm ${selected === day ? "border-primary bg-primary/10" : "border-border"}`}
                  style={
                    i === 0
                      ? { gridColumnStart: ((new Date(`${start}T12:00:00Z`).getUTCDay() + 6) % 7) + 1 }
                      : undefined
                  }
                >
                  <span>{i + 1}</span>
                  {count > 0 ? <span className="bg-primary size-1 rounded-full" /> : null}
                </button>
              )
            })}
          </div>
          {shown.length === 0 ? (
            <StateView state="empty" title={t("empty")} description={t("calendar.emptyHint")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((item) => (
                <li
                  key={item.key}
                  className={`bg-card flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${item.predicted ? "border-dashed" : ""}`}
                >
                  <div className="min-w-0 break-words">
                    {item.url_path ? (
                      <Link className="font-medium hover:underline" href={item.url_path}>
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.title}</span>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {t(`calendar.sources.${item.source}`)}
                      {item.predicted ? ` · ${t("predicted")}` : ""}
                    </p>
                  </div>
                  <time dateTime={item.day} className="text-sm">
                    {date(`${item.day}T12:00:00+05:00`)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <CalendarFeed />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("prefsTitle")}</h2>
        <PrefsForm />
      </section>
    </section>
  )
}
