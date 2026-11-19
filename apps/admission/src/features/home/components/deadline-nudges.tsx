"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, cn, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { useList } from "../../chooser/hooks"
import { useCalendar } from "../../deadlines/calendar-api"
import { useOutcomes } from "../../outcomes/api"
import { buildNudges, type Nudge } from "../nudges"

const DAY_MS = 86_400_000
const TONE = {
  today: "border-destructive/40 bg-destructive/5",
  week: "border-warning/40 bg-warning/5",
  month: "bg-card",
}

function NudgeCard({ nudge }: { nudge: Nudge }) {
  const t = useT("home.dash.nudges")
  const name = nudge.entry.institution.name
  const id = encodeURIComponent(nudge.entry.institution.id)
  const adding = nudge.kind === "add-result"
  return (
    <li
      className={cn(
        "rounded-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between",
        adding ? "bg-card" : TONE[nudge.tier],
      )}
    >
      <p className="flex min-w-0 items-center gap-3 text-sm font-medium">
        <LogoAvatar
          name={name}
          src={nudge.entry.institution.logo_url}
          fit={nudge.entry.institution.logo_fit}
          zoom={nudge.entry.institution.logo_zoom}
          className="size-8 shrink-0 ring-0"
        />
        {adding ? (
          <Icons.check aria-hidden className="text-primary size-4 shrink-0" />
        ) : (
          <Icons.clock aria-hidden className="size-4 shrink-0" />
        )}
        <span>{adding ? t("addResult", { name }) : t(nudge.tier, { name, days: nudge.days })}</span>
      </p>
      <Link
        href={adding ? `/outcomes/?add=${id}&cycle=${nudge.cycleYear}` : `/chooser/institution/?id=${id}`}
        className={cn(buttonVariants({ variant: adding ? "default" : "outline", size: "sm" }), "min-h-11 md:min-h-9")}
      >
        {adding ? t("addResultCta") : t("open")}
      </Link>
    </li>
  )
}

/** "Last chance" cards for planned applications and the "add your result" card after a deadline. */
export function DeadlineNudges() {
  const t = useT("home.dash.nudges")
  const list = useList()
  const outcomes = useOutcomes()
  const [range] = useState(() => {
    const now = Date.now()
    return {
      today: new Date(now).toISOString().slice(0, 10),
      from: new Date(now - 90 * DAY_MS).toISOString().slice(0, 10),
      to: new Date(now + 30 * DAY_MS).toISOString().slice(0, 10),
    }
  })
  const calendar = useCalendar(range.from, range.to)
  const reported = new Set((outcomes.data ?? []).map((outcome) => outcome.institution_id))
  if (!list.data || !calendar.data || !outcomes.data) return null
  const nudges = buildNudges(list.data, calendar.data.items, reported, range.today)
  if (nudges.length === 0) return null
  return (
    <section className="flex flex-col gap-3" aria-label={t("title")}>
      <ul className="flex flex-col gap-3">
        {nudges.slice(0, 4).map((nudge) => (
          <NudgeCard key={`${nudge.kind}-${nudge.entry.id}`} nudge={nudge} />
        ))}
      </ul>
    </section>
  )
}
