"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { RingLogo } from "../../fit/components/ring-logo"
import type { FitRow } from "../../fit/use-fit-rows"
import type { TodayDeadline } from "../api"
import { dayTone, daysBetween, shortDate } from "../dates"

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  admitted: "bg-success/15 text-success",
  waitlist: "bg-warning/15 text-warning",
  rejected: "bg-destructive/10 text-destructive",
}

function StatusChip({ status }: { status: string }) {
  const t = useT("today")
  const style = STATUS_STYLE[status]
  if (!style) return null
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", style)}>{t(`unis.status.${status}`)}</span>
}

/** The nearest dated step of an entry, from the Today deadlines. */
function nextFor(entryId: string, deadlines: TodayDeadline[]) {
  return deadlines.filter((item) => item.list_entry_id === entryId).toSorted((a, b) => a.date.localeCompare(b.date))[0]
}

function Ring({ row, size }: { row: FitRow; size: number }) {
  const { institution } = row.entry
  return (
    <FitRingButton name={institution.name} fit={row.fit} size={size}>
      <RingLogo name={institution.name} src={institution.logo_url} />
    </FitRingButton>
  )
}

function Deadline({ item, today }: { item: TodayDeadline | undefined; today: string }) {
  const t = useT("today")
  const locale = useLocale()
  if (!item) return null
  const days = daysBetween(today, item.date)
  return (
    <span className="text-muted-foreground">
      {shortDate(item.date, locale)} · <span className={cn("font-medium", dayTone(days))}>{t("unis.days", { n: days })}</span>
    </span>
  )
}

/** One university as a desktop row: ring around the logo, name and status, nearest deadline. */
function UniRow({ row, today, deadline }: { row: FitRow; today: string; deadline: TodayDeadline | undefined }) {
  const { entry } = row
  return (
    <li className="flex min-w-0 items-center gap-3 py-2">
      <Ring row={row} size={60} />
      <Link href="/chooser/" className="focus-visible:ring-ring min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{entry.institution.name}</span>
          {entry.round ? <span className="text-muted-foreground rounded border px-1 text-[10px] leading-4">{entry.round}</span> : null}
          <StatusChip status={entry.status} />
        </span>
        <span className="block truncate text-xs">
          <Deadline item={deadline} today={today} />
        </span>
      </Link>
    </li>
  )
}

/** One university as a phone tile of the horizontal rail. */
function UniTile({ row, today, deadline }: { row: FitRow; today: string; deadline: TodayDeadline | undefined }) {
  const t = useT("today")
  const days = deadline ? daysBetween(today, deadline.date) : null
  return (
    <li className="flex w-[76px] shrink-0 snap-start flex-col items-center gap-1.5 pt-1.5 text-center">
      <Ring row={row} size={64} />
      <span className="w-full truncate text-xs font-semibold">{row.entry.institution.name}</span>
      {days !== null ? (
        <span className={cn("text-[11px] leading-none font-medium tabular-nums", dayTone(days))}>{t("unis.days", { n: days })}</span>
      ) : (
        <StatusChip status={row.entry.status} />
      )}
    </li>
  )
}

export function UniSection({
  rows,
  deadlines,
  today,
  loading,
  failed,
  onRetry,
  className,
}: {
  rows: FitRow[]
  deadlines: TodayDeadline[]
  today: string
  loading: boolean
  failed: boolean
  onRetry: () => void
  className?: string
}) {
  const t = useT("today")
  return (
    <section className={cn("bg-card rounded-card flex min-w-0 flex-col gap-1 border px-3.5 py-3 md:px-5 md:py-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{t("unis.title")}</h2>
        <Link href="/chooser/" className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline">
          {t("unis.all")}
          <Icons.arrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
      {loading ? (
        <div className="flex gap-4 py-2" aria-busy>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="size-16 rounded-full" />
          ))}
        </div>
      ) : failed ? (
        <div className="text-muted-foreground flex items-center gap-3 py-3 text-sm">
          <span>{t("error")}</span>
          <button type="button" onClick={onRetry} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("retry")}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 py-3 text-sm">
          <span>{t("unis.empty")}</span>
          <Link href="/chooser/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("unis.add")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="-mx-4 flex snap-x scroll-px-4 gap-1 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none]">
            {rows.map((row) => (
              <UniTile key={row.entry.id} row={row} today={today} deadline={nextFor(row.entry.id, deadlines)} />
            ))}
          </ul>
          <ul className="hidden grid-cols-2 gap-x-6 divide-y md:grid [&>li]:border-0 [&>li:nth-child(n+3)]:border-t">
            {rows.map((row) => (
              <UniRow key={row.entry.id} row={row} today={today} deadline={nextFor(row.entry.id, deadlines)} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
