"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Skeleton, StatusBadge } from "@ihsp/ui"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { flagOf, useCountryProfile, type CountryFact, type CountryProfile, type FactKey } from "../api"
import { useStudentFields } from "../use-student-fields"
import { usd } from "./countries-page"
import { FactBlock, ScoreBar, useCountryName } from "./country-facts-view"

type Facts = NonNullable<CountryProfile["facts"]>

const SECTIONS: { id: string; keys: FactKey[] }[] = [
  { id: "cost", keys: ["cost_of_living", "aid"] },
  { id: "visas", keys: ["student_visa", "work_rights", "bureaucracy"] },
  { id: "postStudy", keys: ["post_study"] },
  { id: "safety", keys: ["safety", "health", "tolerance"] },
  { id: "language", keys: ["language"] },
  { id: "community", keys: ["community", "flights_tashkent"] },
  { id: "living", keys: ["climate", "transport", "travel_reach"] },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="bg-card flex min-w-0 flex-col gap-3 rounded-card border p-4"
    >
      <h2 id={`${id}-title`} className="text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Sources({ urls }: { urls: string[] }) {
  return urls.length > 0 ? (
    <ul className="flex flex-wrap gap-x-3 text-xs">
      {urls.map((url) => (
        <li key={url} className="min-w-0">
          <a className="text-primary break-all underline" href={url} target="_blank" rel="noopener noreferrer">
            {new URL(url).hostname}
          </a>
        </li>
      ))}
    </ul>
  ) : null
}

function FactText({ fact }: { fact: { text: CountryFact["text"] } }) {
  const locale = useLocale() as "en" | "ru" | "uz"
  const text = fact.text[locale] || fact.text.en
  return text ? <p className="text-sm">{text}</p> : null
}

/** Field keys to show: the student's own first, all stored ones when the student chose none. */
function fieldsToShow(highlight: string[], stored: string[]): string[] {
  const own = highlight.filter((f) => stored.includes(f))
  return own.length > 0 ? own : stored
}

function Employers({ facts, highlight }: { facts: Facts; highlight: string[] }) {
  const t = useT("countriesPanel")
  const tc = useT("countries")
  const fact = facts.facts.employers
  const byField = fact?.values.fields ?? {}
  const shown = fieldsToShow(highlight, Object.keys(byField))
  if (!fact || shown.length === 0) return <p className="text-muted-foreground text-sm">{t("noData")}</p>
  return (
    <div className="flex flex-col gap-3">
      {shown.map((field) => (
        <div key={field} className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{tc(`field.${field}`)}</h3>
          <ul className="grid gap-1 sm:grid-cols-2">
            {(byField[field] ?? []).map((e) => (
              <li key={e.name} className="min-w-0 text-sm break-words">
                {e.url ? (
                  <a className="text-primary underline" href={e.url} target="_blank" rel="noopener noreferrer">
                    {e.name}
                  </a>
                ) : (
                  e.name
                )}
                {e.sector ? <span className="text-muted-foreground"> · {e.sector}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <FactText fact={fact} />
      <Sources urls={fact.sources} />
    </div>
  )
}

function Salaries({ facts, highlight }: { facts: Facts; highlight: string[] }) {
  const t = useT("countriesPanel")
  const tc = useT("countries")
  const locale = useLocale()
  const fact = facts.facts.salaries
  const v = fact?.values
  const byField = v?.by_field ?? {}
  const shown = fieldsToShow(highlight, Object.keys(byField))
  if (!fact || !v || (v.overall_median_annual == null && shown.length === 0))
    return <p className="text-muted-foreground text-sm">{t("noData")}</p>
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
        {v.overall_median_annual != null ? (
          <div className="contents">
            <dt className="text-muted-foreground">{t("salaryOverall")}</dt>
            <dd className="font-semibold tabular-nums">{usd(v.overall_median_annual, locale)}</dd>
          </div>
        ) : null}
        {shown.map((field) => (
          <div key={field} className="contents">
            <dt className={highlight.includes(field) ? "font-medium" : "text-muted-foreground"}>
              {tc(`field.${field}`)}
            </dt>
            <dd className="tabular-nums">{usd(byField[field] ?? 0, locale)}</dd>
          </div>
        ))}
      </dl>
      {v.year ? <p className="text-muted-foreground text-xs">{t("salaryNote", { year: v.year })}</p> : null}
      <FactText fact={fact} />
      <Sources urls={fact.sources} />
    </div>
  )
}

function Universities({ profile }: { profile: CountryProfile }) {
  const t = useT("countriesPanel")
  if (profile.institutions.length === 0) return <p className="text-muted-foreground text-sm">{t("noUniversities")}</p>
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid gap-2 sm:grid-cols-2">
        {profile.institutions.map((i) => (
          <li key={i.id}>
            <Link
              href={`/chooser/institution/?id=${encodeURIComponent(i.id)}`}
              className="hover:border-primary flex min-h-11 items-center gap-3 rounded-card border p-2 transition-colors"
            >
              {i.logo_url ? (
                <img src={i.logo_url} alt="" className="size-8 shrink-0 rounded object-contain" loading="lazy" />
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{i.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {[
                    i.city,
                    ...i.rankings.map((r) =>
                      t("rank", {
                        system: r.system.toUpperCase(),
                        rank: String(r.rank),
                        subject: r.subject.replaceAll("_", " "),
                      }),
                    ),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {profile.institution_count > profile.institutions.length ? (
        <p className="text-muted-foreground text-xs">
          {t("moreUniversities", { count: profile.institution_count - profile.institutions.length })}
        </p>
      ) : null}
    </div>
  )
}

function Overview({ facts }: { facts: Facts }) {
  const tc = useT("countries")
  const scored = (Object.entries(facts.facts) as [FactKey, CountryFact][]).filter(([, f]) => f.score !== null)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs">
        {tc("asOf", { date: facts.as_of })} · {facts.verified ? tc("verified") : tc("unverified")}
      </p>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {scored.map(([k, f]) => (
          <ScoreBar key={k} score={f.score ?? 0} label={tc(`fact.${k}`)} />
        ))}
      </div>
    </div>
  )
}

export function CountryBody() {
  const t = useT("countriesPanel")
  const name = useCountryName()
  const code = (useSearchParams().get("code") ?? "").toUpperCase()
  const fields = useStudentFields()
  const query = useCountryProfile(code, fields)

  let body
  if (!/^[A-Z]{2}$/.test(code)) body = <p className="text-muted-foreground text-sm">{t("notFound")}</p>
  else if (query.isPending) body = <Skeleton className="h-64 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else {
    const profile = query.data
    const facts = profile.facts
    const highlight = profile.highlight
    body = (
      <div className="flex flex-col gap-4">
        {facts ? (
          <Section id="overview" title={t("section.overview")}>
            <Overview facts={facts} />
          </Section>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noFacts")}</p>
        )}
        {facts?.facts.opportunities ? (
          <Section id="opportunities" title={t("section.opportunities")}>
            {highlight.length === 0 ? <p className="text-muted-foreground text-xs">{t("chooseFields")}</p> : null}
            <FactBlock k="opportunities" fact={facts.facts.opportunities} highlight={highlight} hideTitle />
          </Section>
        ) : null}
        {facts ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Section id="salaries" title={t("section.salaries")}>
              <Salaries facts={facts} highlight={highlight} />
            </Section>
            <Section id="employers" title={t("section.employers")}>
              <Employers facts={facts} highlight={highlight} />
            </Section>
          </div>
        ) : null}
        <Section id="universities" title={t("section.universities")}>
          <Universities profile={profile} />
        </Section>
        {facts ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {SECTIONS.map((s) => {
              const present = s.keys.filter((k) => facts.facts[k])
              return present.length > 0 ? (
                <Section key={s.id} id={s.id} title={t(`section.${s.id}`)}>
                  {present.map((k) => {
                    const fact = facts.facts[k]
                    return fact ? <FactBlock key={k} k={k} fact={fact} highlight={highlight} /> : null
                  })}
                </Section>
              ) : null
            })}
          </div>
        ) : null}
      </div>
    )
  }

  const verified = query.data?.facts?.verified
  return (
    <div className={pageClass()}>
      <Link href="/countries/" className="text-primary inline-flex min-h-11 items-center text-sm underline md:min-h-8">
        {t("back")}
      </Link>
      <AppPageHeader
        icon="globe"
        title={`${flagOf(code)} ${code ? name(code) : t("title")}`.trim()}
        meta={query.data ? t(`region.${query.data.region}`) : undefined}
        badge={
          verified === undefined ? undefined : (
            <StatusBadge tone={verified ? "success" : "warning"} label={verified ? t("verified") : t("unverified")} />
          )
        }
      />
      {body}
    </div>
  )
}

export function CountryPage() {
  return (
    <AdmissionShell>
      <CountryBody />
    </AdmissionShell>
  )
}
