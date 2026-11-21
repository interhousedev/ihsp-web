"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { FitRing } from "../../fit/components/fit-ring"
import { DEFAULT_WEIGHTS, METRIC_IDS, type MetricResult } from "../../fit/fit-model"
import { dayTone, daysBetween, shortDate } from "../dates"
import type { Profession, UniRowData, UniStatus } from "../today-mock"
import { useMockLogos, type MockLogo } from "../use-logos"

const STATUS_STYLE: Record<UniStatus, string> = {
  draft: "hidden",
  pending: "bg-muted text-muted-foreground",
  admitted: "bg-success/15 text-success",
  waitlist: "bg-warning/15 text-warning",
  rejected: "bg-destructive/10 text-destructive",
}

function Logo({ name, logo }: { name: string; logo: MockLogo | undefined }) {
  return <LogoAvatar name={name} src={logo?.src} fit={logo?.fit} zoom={logo?.zoom} className="size-full ring-0" />
}

function StatusChip({ status }: { status: UniStatus }) {
  const t = useT("today")
  if (status === "draft") return null
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", STATUS_STYLE[status])}>{t(`unis.status.${status}`)}</span>
}

function DaysLeft({ row, today }: { row: UniRowData; today: string }) {
  const t = useT("today")
  const locale = useLocale()
  if (!row.deadline || row.status === "rejected") return null
  const days = daysBetween(today, row.deadline)
  if (row.status === "pending" || row.status === "admitted" || row.status === "waitlist") {
    return <span className="text-muted-foreground">{shortDate(row.deadline, locale)}</span>
  }
  return (
    <span className="text-muted-foreground">
      {shortDate(row.deadline, locale)} · <span className={cn("font-medium", dayTone(days))}>{t("unis.days", { n: days })}</span>
    </span>
  )
}

/** One university as a desktop row: ring around the logo, name and status, deadline, task count. */
function UniRow({ row, today, logo }: { row: UniRowData; today: string; logo: MockLogo | undefined }) {
  const t = useT("today")
  return (
    <li className="flex min-w-0 items-center gap-3 py-2">
      <FitRingButton name={row.uni.name} fit={row.fit} weights={DEFAULT_WEIGHTS} size={60}>
        <Logo name={row.uni.short} logo={logo} />
      </FitRingButton>
      <Link href="/chooser/" className="focus-visible:ring-ring min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{row.uni.short}</span>
          {row.round ? <span className="text-muted-foreground rounded border px-1 text-[10px] leading-4">{row.round}</span> : null}
          <StatusChip status={row.status} />
        </span>
        <span className="block truncate text-xs">
          <DaysLeft row={row} today={today} />
          {row.uni.home ? <span className="text-muted-foreground"> · {t("unis.home")}</span> : null}
        </span>
      </Link>
      {row.tasks ? (
        <span className="text-muted-foreground hidden shrink-0 text-xs tabular-nums xl:block">
          {t("unis.tasks", { done: row.tasks.done, total: row.tasks.total })}
        </span>
      ) : null}
    </li>
  )
}

/** One university as a phone tile of the horizontal rail. */
function UniTile({ row, today, logo }: { row: UniRowData; today: string; logo: MockLogo | undefined }) {
  const t = useT("today")
  const days = row.deadline && row.status === "draft" ? daysBetween(today, row.deadline) : null
  return (
    <li className="flex w-[76px] shrink-0 snap-start flex-col items-center gap-1.5 pt-1.5 text-center">
      <FitRingButton name={row.uni.name} fit={row.fit} weights={DEFAULT_WEIGHTS} size={64}>
        <Logo name={row.uni.short} logo={logo} />
      </FitRingButton>
      <span className="w-full truncate text-xs font-semibold">{row.uni.short}</span>
      {days !== null ? (
        <span className={cn("text-[11px] leading-none font-medium tabular-nums", dayTone(days))}>{t("unis.days", { n: days })}</span>
      ) : (
        <StatusChip status={row.status} />
      )}
    </li>
  )
}

/** Grade 10: no universities yet; three professions with the AI-replacement risk, and an all-grey sample ring. */
function Professions({ items }: { items: Profession[] }) {
  const t = useT("today")
  const tf = useT("fit")
  const grey: MetricResult[] = METRIC_IDS.map((id) => ({ id, score: null, why: [] }))
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-2 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 rounded-xl border p-3">
            <span className="text-sm font-semibold">{tf(`terms.prof.${item.id}`)}</span>
            <span
              className={cn(
                "w-fit rounded-full px-2 py-0.5 text-[11px] font-medium",
                item.risk === "low" ? "bg-success/15 text-success" : item.risk === "mid" ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive",
              )}
            >
              {t("prof.risk", { risk: tf(`terms.risk.${item.risk}`) })}
            </span>
            <span className="text-muted-foreground text-xs leading-snug">{t(`prof.note.${item.id}`)}</span>
          </li>
        ))}
      </ul>
      <div className="text-muted-foreground flex items-center gap-3 text-sm">
        <FitRing metrics={grey} weights={DEFAULT_WEIGHTS} size={44}>
          <Icons.search aria-hidden className="size-4" />
        </FitRing>
        <p className="min-w-0 leading-snug">{t("prof.later")}</p>
      </div>
    </div>
  )
}

export function UniSection({
  unis,
  professions,
  today,
  className,
}: {
  unis: UniRowData[]
  professions: Profession[]
  today: string
  className?: string
}) {
  const t = useT("today")
  const logos = useMockLogos()
  const empty = unis.length === 0
  return (
    <section className={cn("bg-card rounded-card flex min-w-0 flex-col gap-1 border px-3.5 py-3 md:px-5 md:py-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight">{empty ? t("prof.title") : t("unis.title")}</h2>
        {empty ? null : (
          <Link href="/chooser/" className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline">
            {t("unis.all")}
            <Icons.arrowRight aria-hidden className="size-3.5" />
          </Link>
        )}
      </div>
      {empty ? (
        <Professions items={professions} />
      ) : (
        <>
          <ul className="-mx-4 flex snap-x scroll-px-4 gap-1 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none]">
            {unis.map((row) => (
              <UniTile key={row.uni.id} row={row} today={today} logo={logos[row.uni.id]} />
            ))}
          </ul>
          <ul className="hidden grid-cols-2 gap-x-6 divide-y md:grid [&>li]:border-0 [&>li:nth-child(n+3)]:border-t">
            {unis.map((row) => (
              <UniRow key={row.uni.id} row={row} today={today} logo={logos[row.uni.id]} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
