"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LogoAvatar } from "../../../components/lib/photo-header"
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

/** One university of the swipe deck: name, the facts that decide (admission rate, yearly cost after aid against the budget) and why it matches. */
export function MatchCard({ match }: { match: Match }) {
  const t = useT("discover")
  const list = useT("uniList")
  const locale = useLocale()
  const countryLabel = useOptionLabel("country")
  const tagLabel = useTagLabel()
  const preferences = useQuery(preferencesQuery())
  const budget = familyBudgetUsd(preferences.data?.answers.budget)
  const place = [match.city, countryLabel(match.country)].filter(Boolean).join(", ")
  const dash = "—"
  const cost = match.cost_after_aid_usd
  const gap = cost !== null && budget !== null ? cost - budget : null
  const money = (value: number) => formatCompactCurrency(value, "USD", locale)
  const why = match.overlap.tags.map(tagLabel).join(" · ")
  return (
    <article className="bg-card border-hairline-strong rounded-card flex h-full flex-col overflow-hidden border shadow-sm">
      <div
        data-testid="match-cover"
        className="from-primary/30 to-primary/5 relative h-20 shrink-0 bg-gradient-to-br bg-cover bg-center md:h-24"
        style={match.cover_url ? { backgroundImage: `url(${JSON.stringify(encodeURI(match.cover_url))})` } : undefined}
      >
        {match.status ? (
          <div className="absolute top-3 right-3">
            <StatusPill status={match.status} />
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 md:px-5">
        <LogoAvatar name={match.name} src={match.logo_url} className="-mt-8 size-16" />
        <div className="min-w-0">
          <h3 className="text-lg leading-tight font-semibold">{match.name}</h3>
          <p className="text-muted-foreground text-sm">{place}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <Stat
            label={t("stats.admissionRate")}
            value={match.admission_rate == null ? dash : percent(match.admission_rate)}
          />
          <Stat
            label={t("stats.cost")}
            value={cost === null ? dash : list("approx", { amount: money(cost) })}
            note={
              gap === null
                ? undefined
                : gap > 0
                  ? list("over", { amount: money(gap) })
                  : list("under", { amount: money(-gap) })
            }
            noteTone={gap !== null && gap > 0 ? "text-destructive" : "text-success"}
          />
        </dl>
        {why ? (
          <p aria-label={t("overlap.label")} className="text-muted-foreground line-clamp-2 text-sm">
            {t("overlap.why", { tags: why })}
          </p>
        ) : null}
      </div>
    </article>
  )
}
