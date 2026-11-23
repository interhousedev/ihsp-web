"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { REGIONS, flagOf, useCountries, type CountryOverview, type Region } from "../api"
import { ScoreBar, useCountryName } from "./country-facts-view"

const CARD_SCORES = ["cost_of_living", "safety", "opportunities", "work_rights", "post_study"] as const
const ANY = "any"

export function usd(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function CountryCard({ item }: { item: CountryOverview }) {
  const t = useT("countriesPanel")
  const tc = useT("countries")
  const name = useCountryName()
  const locale = useLocale()
  const scores = CARD_SCORES.filter((k) => typeof item.scores[k] === "number")
  return (
    <li>
      <Link
        href={`/countries/country/?code=${item.country}`}
        className="bg-card hover:border-primary flex h-full min-h-11 flex-col gap-2 rounded-card border p-3 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-2xl leading-none">
            {flagOf(item.country)}
          </span>
          <span className="min-w-0 flex-1 truncate font-semibold">{name(item.country)}</span>
        </span>
        <span className="text-muted-foreground text-xs">
          {t(`region.${item.region}`)} · {t("universities", { count: item.institution_count })}
          {item.median_salary_usd !== null
            ? ` · ${t("medianShort", { amount: usd(item.median_salary_usd, locale) })}`
            : ""}
        </span>
        {scores.length > 0 ? (
          <span className="flex flex-col gap-1">
            {scores.map((k) => (
              <ScoreBar key={k} score={item.scores[k] ?? 0} label={tc(`fact.${k}`)} />
            ))}
          </span>
        ) : item.status !== "missing" ? (
          <span className="text-muted-foreground text-xs">{tc("staff.coverage", { percent: item.coverage })}</span>
        ) : (
          <span className="text-muted-foreground text-xs">{t("noFacts")}</span>
        )}
      </Link>
    </li>
  )
}

export function CountriesBody() {
  const t = useT("countriesPanel")
  const name = useCountryName()
  const query = useCountries()
  const [q, setQ] = useState("")
  const [region, setRegion] = useState<Region | null>(null)
  const needle = q.trim().toLowerCase()
  const items = (query.data?.items ?? [])
    .filter((item) => !region || item.region === region)
    .filter((item) => {
      if (!needle) return true
      const en = new Intl.DisplayNames(["en"], { type: "region" }).of(item.country) ?? ""
      return [item.country, name(item.country), en].some((v) => v.toLowerCase().includes(needle))
    })
    .toSorted((a, b) => name(a.country).localeCompare(name(b.country)))

  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (items.length === 0) body = <p className="text-muted-foreground text-sm">{t("empty")}</p>
  else
    body = (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CountryCard key={item.country} item={item} />
        ))}
      </ul>
    )

  return (
    <div className={pageClass()}>
      <AppPageHeader icon="globe" title={t("title")} />
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="search"
          aria-label={t("search")}
          placeholder={t("search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={region ?? ANY} onValueChange={(v) => setRegion(v === ANY ? null : (v as Region))}>
          <SelectTrigger aria-label={t("regionLabel")} className="min-h-11 w-full md:min-h-8">
            <SelectValue>{region ? t(`region.${region}`) : t("anyRegion")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("anyRegion")}</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {t(`region.${r}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {body}
    </div>
  )
}

export function CountriesPage() {
  return (
    <AdmissionShell>
      <CountriesBody />
    </AdmissionShell>
  )
}
