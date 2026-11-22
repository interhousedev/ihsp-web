"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { ResponsiveDialog } from "@ihsp/ui"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { RingLogo } from "../../fit/components/ring-logo"
import { totalFit } from "../../fit/fit-model"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { preferencesQuery } from "../../algorithm/api"
import { familyBudgetUsd } from "../../chooser/list-model"
import { formatCompactCurrency } from "../../chooser/components/money"
import { useOptionLabel } from "../../chooser/components/option-label"
import { percent } from "../format"
import { MatchExtrasView, type CardMatch } from "./match-extras"
import { UniChatPanel } from "./uni-chat-panel"
import { StatusPill } from "./status-pill"
import { useTagLabel } from "./tag-label"

function Stat({ label, value, note, noteTone }: { label: string; value: string; note?: string; noteTone?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate text-base font-semibold">{value}</dd>
      {note ? <dd className={cn("text-xs leading-tight", noteTone)}>{note}</dd> : null}
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
  const fitT = useT("fit")
  const [researching, setResearching] = useState(false)
  const budget = familyBudgetUsd(preferences.data?.answers.budget)
  const place = [match.city, countryLabel(match.country)].filter(Boolean).join(", ")
  const dash = "—"
  const cost = match.cost_after_aid_usd
  const gap = cost !== null && budget !== null ? cost - budget : null
  const money = (value: number) => formatCompactCurrency(value, "USD", locale)
  const why = match.overlap.tags.map(tagLabel).join(" · ")
  const rate = match.intl_acceptance_rate ?? match.admission_rate
  const next = match.next_deadline
  const deadline = next
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(next.date))
    : null
  const fit = match.fit_total == null ? null : totalFit(match.fit_total, match.known_share)
  const thin = match.known_share != null && match.known_share < 0.75
  const facts: { label: string; value: string; note?: string; noteTone?: string }[] = []
  if (rate != null) facts.push({ label: t("stats.admissionRate"), value: percent(rate) })
  if (deadline) facts.push({ label: t("stats.deadline"), value: deadline })
  if (cost !== null)
    facts.push({
      label: t("stats.cost"),
      value: list("approx", { amount: money(cost) }),
      note:
        gap === null
          ? undefined
          : gap > 0
            ? list("over", { amount: money(gap) })
            : list("under", { amount: money(-gap) }),
      noteTone: gap !== null && gap > 0 ? "text-destructive" : "text-success",
    })
  const logo = <RingLogo name={match.name} src={match.logo_url} />
  return (
    <article className="bg-card border-hairline-strong rounded-card relative flex h-full min-h-0 flex-col gap-2.5 overflow-hidden border p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-3">
        {fit ? (
          <FitRingButton name={match.name} fit={fit} size={52}>
            {logo}
          </FitRingButton>
        ) : (
          <div className="size-12 shrink-0">{logo}</div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg leading-tight font-semibold break-words">{match.name}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{place}</p>
        </div>
      </div>
      {match.fit_total == null && !match.status ? null : (
        <div className="flex items-center justify-between gap-3">
          {match.fit_total == null ? (
            <span />
          ) : (
            <span className="flex items-baseline gap-1 leading-none" aria-hidden>
              <span className="text-2xl font-semibold tabular-nums">{match.fit_total}</span>
              <span className="text-muted-foreground text-[10px]">/100</span>
            </span>
          )}
          {match.status ? <StatusPill status={match.status} /> : null}
        </div>
      )}
      {facts.length >= 2 ? (
        <dl className="grid grid-cols-2 gap-3">
          {facts.map((fact) => (
            <Stat key={fact.label} {...fact} />
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("fewFacts")} —{" "}
          <button
            type="button"
            onClick={() => setResearching(true)}
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            {t("research")}
          </button>
        </p>
      )}
      <ResponsiveDialog open={researching} onOpenChange={setResearching} title={match.name} size="lg">
        {researching ? <UniChatPanel match={match} /> : null}
      </ResponsiveDialog>
      {fit && thin ? (
        <p className="text-muted-foreground text-xs">
          {fitT("known", { pct: Math.round((match.known_share ?? 0) * 100) })}
        </p>
      ) : null}
      <MatchExtrasView match={match as CardMatch} />
      {why ? (
        <p aria-label={t("overlap.label")} className="text-muted-foreground line-clamp-1 text-xs">
          {t("overlap.why", { tags: why })}
        </p>
      ) : null}
    </article>
  )
}
