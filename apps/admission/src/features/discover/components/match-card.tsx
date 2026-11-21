"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { RingLogo } from "../../fit/components/ring-logo"
import { useInstitution } from "../../chooser/hooks"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { preferencesQuery } from "../../algorithm/api"
import { familyBudgetUsd } from "../../chooser/list-model"
import { formatCompactCurrency } from "../../chooser/components/money"
import { useOptionLabel } from "../../chooser/components/option-label"
import { percent } from "../format"
import { StatusPill } from "./status-pill"
import { useTagLabel } from "./tag-label"

function Stat({ label, value, note, noteTone }: { label: string; value: string; note?: string; noteTone?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate text-base font-semibold">{value}</dd>
      {note ? <dd className={cn("truncate text-xs", noteTone)}>{note}</dd> : null}
    </div>
  )
}

/** One university of the swipe deck: the facts that decide (intl admit rate, cost after aid against the budget, next deadline) and why it matches. */
export function MatchCard({ match }: { match: Match }) {
  const t = useT("discover")
  const list = useT("uniList")
  const locale = useLocale()
  const countryLabel = useOptionLabel("country")
  const tagLabel = useTagLabel()
  const preferences = useQuery(preferencesQuery())
  const detail = useInstitution(match.university_id).data
  const budget = familyBudgetUsd(preferences.data?.answers.budget)
  const place = [match.city, countryLabel(match.country)].filter(Boolean).join(", ")
  const dash = "—"
  const cost = match.cost_after_aid_usd
  const gap = cost !== null && budget !== null ? cost - budget : null
  const money = (value: number) => formatCompactCurrency(value, "USD", locale)
  const why = match.overlap.tags.map(tagLabel).join(" · ")
  const intlRate = detail?.facts.intl_acceptance_rate?.value
  const rate = typeof intlRate === "number" ? intlRate : match.admission_rate
  const today = new Date().toISOString().slice(0, 10)
  const next = detail?.deadlines.filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
  const deadline = next
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(next.date))
    : null
  return (
    <article className="bg-card border-hairline-strong rounded-card flex h-full flex-col gap-3 border p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-3">
        <div className="size-12 shrink-0">
          <RingLogo name={match.name} src={match.logo_url} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight font-semibold">{match.name}</h3>
          <p className="text-muted-foreground truncate text-sm">{place}</p>
        </div>
        {match.status ? <StatusPill status={match.status} /> : null}
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Stat label={t("stats.admissionRate")} value={rate == null ? dash : percent(rate)} />
        <Stat label={t("stats.deadline")} value={deadline ?? dash} />
        <Stat
          label={t("stats.cost")}
          value={cost === null ? dash : list("approx", { amount: money(cost) })}
          note={
            gap === null ? undefined : gap > 0 ? list("over", { amount: money(gap) }) : list("under", { amount: money(-gap) })
          }
          noteTone={gap !== null && gap > 0 ? "text-destructive" : "text-success"}
        />
      </dl>
      {why ? (
        <p aria-label={t("overlap.label")} className="text-muted-foreground line-clamp-2 text-sm">
          {t("overlap.why", { tags: why })}
        </p>
      ) : null}
    </article>
  )
}
