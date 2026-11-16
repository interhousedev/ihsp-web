"use client"

import { useT } from "@ihsp/i18n"
import { Pill } from "@ihsp/ui"
import { LogoAvatar } from "../../../components/lib/photo-header"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { useOptionLabel } from "../../chooser/components/option-label"
import { percent, usd } from "../format"
import { StatusPill } from "./status-pill"
import { useTagLabel } from "./tag-label"

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={`truncate text-base font-semibold ${tone ?? ""}`}>{value}</dd>
    </div>
  )
}

/** One college of the swipe deck. */
export function MatchCard({ match }: { match: Match }) {
  const t = useT("discover")
  const countryLabel = useOptionLabel("country")
  const typeLabel = useOptionLabel("type")
  const tagLabel = useTagLabel()
  const place = [match.city, countryLabel(match.country)].filter(Boolean).join(", ")
  const dash = "—"
  return (
    <article className="bg-card border-hairline-strong rounded-card flex h-full flex-col overflow-hidden border shadow-sm">
      <div
        data-testid="match-cover"
        className="from-primary/30 to-primary/5 relative h-32 shrink-0 bg-gradient-to-br bg-cover bg-center md:h-40"
        style={match.cover_url ? { backgroundImage: `url(${JSON.stringify(encodeURI(match.cover_url))})` } : undefined}
      >
        {match.status ? (
          <div className="absolute top-3 right-3">
            <StatusPill status={match.status} />
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 md:px-5">
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
          <Stat label={t("stats.match")} value={`${match.match_pct}%`} tone="text-success" />
          <Stat label={t("stats.type")} value={match.institution_type ? typeLabel(match.institution_type) : dash} />
          <Stat
            label={t("stats.cost")}
            value={match.cost_after_aid_usd === null ? dash : usd(match.cost_after_aid_usd)}
          />
        </dl>
        <section aria-label={t("overlap.label")} className="flex min-h-0 flex-col gap-2">
          <h4 className="text-sm font-medium">
            {t("overlap.title", { count: match.overlap.count, total: match.overlap.total })}
          </h4>
          <ul className="flex flex-wrap gap-1.5">
            {match.overlap.tags.map((tag) => (
              <li key={tag}>
                <Pill tone="primary">{tagLabel(tag)}</Pill>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
