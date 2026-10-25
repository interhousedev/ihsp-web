"use client"

import type { LibraryStats } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Stat } from "@ihsp/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { browseHref, itemHref } from "../../utils/hrefs"

/** A titled block of the dashboard. */
export function StatsSection({
  title,
  children,
  wide = false,
}: {
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <section
      aria-label={title}
      className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 ${wide ? "md:col-span-2" : ""}`}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** The service level of the design: a decision within 2 school days (48 hours). */
export const SLOW_QUEUE_HOURS = 48

export function useHours(): (hours: number) => string {
  const { locale } = useFormatters()
  return (hours) =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "hour",
      unitDisplay: "short",
      maximumFractionDigits: 1,
    }).format(hours)
}

/** Queue length and age, with a warning when the oldest item has waited longer than the service level. */
export function QueueBlock({ queue }: { queue: LibraryStats["queue"] }) {
  const t = useT("library.manage.stats.queue")
  const hours = useHours()
  const slow = queue.oldest_age_hours !== null && queue.oldest_age_hours > SLOW_QUEUE_HOURS
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("length")} value={queue.length} />
        <Stat label={t("oldest")} value={queue.oldest_age_hours === null ? "–" : hours(queue.oldest_age_hours)} />
        <Stat label={t("average")} value={queue.average_hours === null ? "–" : hours(queue.average_hours)} />
      </div>
      {slow ? (
        <p role="status" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm font-medium">
          {t("slow")}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">{t("serviceLevel")}</p>
      )}
    </div>
  )
}

/** Uploads per day as bars; the count is printed next to each bar, so the picture adds nothing a reader must see. */
export function UploadsBars({ days }: { days: LibraryStats["uploads_by_day"] }) {
  const t = useT("library.manage.stats")
  const format = useFormatters()
  const max = Math.max(1, ...days.map((day) => day.count))
  if (days.length === 0) return <p className="text-muted-foreground text-sm">{t("noUploads")}</p>
  return (
    <ul aria-label={t("uploads")} className="flex flex-col gap-1.5">
      {days.map((day) => (
        <li key={day.day} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
          <span className="text-muted-foreground tabular-nums">
            {format.date(day.day, { day: "numeric", month: "short" })}
          </span>
          <span aria-hidden className="bg-muted h-3 overflow-hidden rounded-full">
            <span className="bg-primary block h-full rounded-full" style={{ width: `${(day.count / max) * 100}%` }} />
          </span>
          <span className="text-end font-medium tabular-nums">{day.count}</span>
        </li>
      ))}
    </ul>
  )
}

/** A two-column list: a label and a number, for statuses, reasons and similar. */
export function CountList({
  label,
  rows,
  empty,
}: {
  label: string
  rows: { key: string; name: ReactNode; count: number }[]
  empty: string
}) {
  if (rows.length === 0) return <p className="text-muted-foreground text-sm">{empty}</p>
  return (
    <ul aria-label={label} className="flex flex-col divide-y text-sm">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 py-1.5">
          <span className="min-w-0 break-words">{row.name}</span>
          <span className="font-medium tabular-nums">{row.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function TopItems({ rows }: { rows: LibraryStats["top_items"] }) {
  const t = useT("library.manage.stats")
  return (
    <CountList
      label={t("topItems")}
      empty={t("noTopItems")}
      rows={rows.map((row) => ({
        key: row.item.id ?? row.item.title,
        name: row.item.id ? (
          <Link href={itemHref(row.item.id)} className="hover:underline">
            {row.item.title}
          </Link>
        ) : (
          row.item.title
        ),
        count: row.opens,
      }))}
    />
  )
}

export function SubjectsWithoutMaterials({ rows }: { rows: LibraryStats["subjects_without_materials"] }) {
  const t = useT("library.manage.stats")
  if (rows.length === 0) return <p className="text-muted-foreground text-sm">{t("noGaps")}</p>
  return (
    <ul aria-label={t("subjectsWithout")} className="flex flex-wrap gap-2">
      {rows.map((subject) => (
        <li key={subject.id}>
          <Link
            href={browseHref({ subject: subject.id })}
            className="hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-4 text-sm md:min-h-8"
          >
            {subject.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
