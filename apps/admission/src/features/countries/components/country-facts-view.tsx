"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { FACT_KEYS, type CountryFact, type CountryFacts, type FactKey } from "../api"

const OPPORTUNITY_KEYS = [
  "cs_it",
  "engineering",
  "business_econ",
  "medicine_bio",
  "natural_sci",
  "social_law",
  "arts_media",
  "education_hum",
] as const

/** A 1-5 bar (5 is best for the student); the number is also written for screen readers. */
export function ScoreBar({ score, label, highlight }: { score: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${label}: ${score}/5`}>
      <span className={cn("min-w-0 flex-1 truncate text-xs", highlight && "font-semibold")}>{label}</span>
      <span className="bg-muted h-2 w-20 shrink-0 overflow-hidden rounded-full">
        <span className="bg-primary block h-full" style={{ width: `${score * 20}%` }} />
      </span>
      <span className="w-6 shrink-0 text-right text-xs tabular-nums">{score}/5</span>
    </div>
  )
}

const SCORE_KEYS: readonly string[] = ["domestic_rail", "domestic_bus", "domestic_air", "international"]

type Translate = (key: string, values?: Record<string, string | number>) => string
type Loose = Translate & { has: (key: string) => boolean }

function humanize(name: string): string {
  const s = name.replaceAll("_", " ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const CURRENCIES = new Set([
  "usd",
  "eur",
  "gbp",
  "krw",
  "jpy",
  "cny",
  "cad",
  "chf",
  "aud",
  "nzd",
  "sgd",
  "myr",
  "aed",
  "sar",
  "qar",
  "try",
  "inr",
  "rub",
  "kzt",
  "uzs",
  "pln",
  "czk",
  "huf",
  "sek",
  "nok",
  "dkk",
  "hkd",
  "brl",
])
const PERIODS = new Set(["month", "year", "hour"])

/** Splits a key like `blocked_account_eur_year` into its base name, currency code and period tokens. */
function parseKey(name: string): { base: string; currency: string | null; period: string | null } {
  let currency: string | null = null
  let period: string | null = null
  const rest: string[] = []
  for (const token of name.split("_")) {
    if (!currency && CURRENCIES.has(token)) currency = token.toUpperCase()
    else if (!period && PERIODS.has(token) && rest.length > 0 && name !== "months") period = token
    else rest.push(token)
  }
  return { base: rest.join("_") || name, currency, period }
}

function money(n: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
}

function factLabel(name: string, t: Translate): string {
  const loose = t as unknown as Loose
  const { base } = parseKey(name)
  for (const key of [name, base]) if (loose.has(`values.label.${key}`)) return t(`values.label.${key}`)
  return humanize(base)
}

/** A fact value as text, formatted by what its key says it is (money, degrees, days, hours, yes/no). */
function formatValue(name: string, value: unknown, locale: string, t: Translate): string {
  if (typeof value === "boolean") return t(value ? "values.unit.yes" : "values.unit.no")
  if (Array.isArray(value)) return value.map((v) => formatValue(name, v, locale, t)).join(", ")
  if (typeof value !== "number") return String(value)
  const num = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const { currency, period } = parseKey(name)
  if (currency) {
    const shown = money(value, locale, currency)
    return period ? t(`values.unit.${period}`, { value: shown }) : shown
  }
  if (name === "days_year") return t("values.unit.daysYear", { value: num.format(value) })
  if (name.includes("_c_")) return t("values.unit.c", { value: num.format(value) })
  if (name.endsWith("days")) return t("values.unit.days", { value: num.format(value) })
  if (name.startsWith("hours_")) return t("values.unit.hw", { value: num.format(value) })
  if (name === "months") return t("values.unit.months", { value: num.format(value) })
  if (name === "tz_diff_hours") {
    return t("values.unit.h", { value: new Intl.NumberFormat(locale, { signDisplay: "exceptZero" }).format(value) })
  }
  if (name === "hours") return t("values.unit.h", { value: num.format(value) })
  return num.format(value)
}

/** One fact: score, its numbers (opportunities as per-field bars) and the localized text with sources. */
export function FactBlock({
  k,
  fact,
  highlight,
  hideTitle,
}: {
  k: FactKey
  fact: CountryFact
  highlight: string[]
  hideTitle?: boolean
}) {
  const t = useT("countries")
  const locale = useLocale() as "en" | "ru" | "uz"
  const text = fact.text[locale] || fact.text.en || ""
  const scored = k === "opportunities" ? OPPORTUNITY_KEYS : []
  const entries = Object.entries(fact.values).filter(([name]) => !scored.includes(name as never))
  return (
    <section className={cn("flex min-w-0 flex-col gap-1.5 break-words", !hideTitle && "border-b pb-3 last:border-b-0")}>
      {hideTitle ? null : <h3 className="text-sm font-semibold">{t(`fact.${k}`)}</h3>}
      {fact.score !== null ? <ScoreBar score={fact.score} label={t("overall")} /> : null}
      {scored.map((name) => {
        const value = fact.values[name]
        return typeof value === "number" ? (
          <ScoreBar key={name} score={value} label={t(`field.${name}`)} highlight={highlight.includes(name)} />
        ) : null
      })}
      {entries.length > 0 ? (
        <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-0.5 text-xs">
          {entries.map(([name, value]) => (
            <div key={name} className="contents">
              <dt className="text-muted-foreground">{factLabel(name, t as Translate)}</dt>
              <dd>
                {SCORE_KEYS.includes(name) && typeof value === "number" && value >= 1 && value <= 5 ? (
                  <ScoreBar score={value} label={factLabel(name, t as Translate)} />
                ) : (
                  formatValue(name, value, locale, t as Translate)
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {text ? <p className="text-sm">{text}</p> : null}
      {fact.sources.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 text-xs">
          {fact.sources.map((url) => (
            <li key={url} className="min-w-0">
              <a className="text-primary break-all underline" href={url} target="_blank" rel="noopener noreferrer">
                {new URL(url).hostname}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

/** Every fact of one country with the as-of date and an "unverified" mark. */
export function CountryFactsView({ facts, highlight }: { facts: CountryFacts; highlight: string[] }) {
  const t = useT("countries")
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">
        {t("asOf", { date: facts.as_of })} · {facts.verified ? t("verified") : t("unverified")}
      </p>
      {FACT_KEYS.map((k) => {
        const fact = facts.facts[k]
        return fact ? <FactBlock key={k} k={k} fact={fact} highlight={highlight} /> : null
      })}
    </div>
  )
}

/** Up to three countries side by side: a table from `md` up, stacked cards below. */
export function CountryCompare({ items, highlight }: { items: CountryFacts[]; highlight: string[] }) {
  const t = useT("countries")
  const name = useCountryName()
  const rows = FACT_KEYS.filter((k) => items.some((c) => c.facts[k]))
  return (
    <>
      <table className="hidden w-full table-fixed border-collapse text-left md:table">
        <thead>
          <tr>
            <th className="w-28" />
            {items.map((c) => (
              <th key={c.country} className="p-2 text-sm break-words">
                {name(c.country)}
                {c.verified ? null : <span className="text-muted-foreground block text-xs">{t("unverified")}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((k) => (
            <tr key={k} className="border-t align-top">
              <th scope="row" className="p-2 text-xs font-medium break-words">
                {t(`fact.${k}`)}
              </th>
              {items.map((c) => (
                <td key={c.country} className="min-w-0 p-2 break-words">
                  {c.facts[k] ? <FactBlock k={k} fact={c.facts[k]} highlight={highlight} hideTitle /> : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 md:hidden">
        {items.map((c) => (
          <div key={c.country} className="rounded-card border p-3">
            <h2 className="mb-2 font-semibold">{name(c.country)}</h2>
            <CountryFactsView facts={c} highlight={highlight} />
          </div>
        ))}
      </div>
    </>
  )
}

export function useCountryName() {
  const locale = useLocale()
  return (code: string) => new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code
}
