"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useState } from "react"
import type { AdmissionMatch } from "@ihsp/api"

export type CardMatch = AdmissionMatch

export function Info({ label, children }: { label: string; children: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        className="text-muted-foreground border-hairline-strong inline-flex size-5 items-center justify-center rounded-full border text-[11px] leading-none"
      >
        i
      </button>
      {open ? (
        <span
          role="tooltip"
          className="bg-popover text-popover-foreground border-hairline-strong absolute start-0 top-6 z-20 w-56 rounded-md border p-2 text-xs shadow-md"
        >
          {children}
        </span>
      ) : null}
    </span>
  )
}

/** Description, field chips, subject rankings, experience meters and the map link of a match card. */
export function MatchExtrasView({ match }: { match: CardMatch }) {
  const t = useT("discover")
  const locale = useLocale()
  const [more, setMore] = useState(false)
  const rankings = (match.rankings ?? []).slice(0, 2)
  const experience = (match.experience ?? []).filter((e) => e.score >= 1 && e.score <= 5)
  const subject = (slug: string) =>
    t.has(`extras.subjects.${slug}`) ? t(`extras.subjects.${slug}`) : slug.replaceAll("_", " ")
  return (
    <div className="flex flex-col gap-3">
      {match.description ? (
        <div>
          <p className={more ? "text-sm" : "line-clamp-3 text-sm"}>{match.description}</p>
          <button
            type="button"
            aria-expanded={more}
            onClick={() => setMore((v) => !v)}
            className="text-primary text-xs font-medium"
          >
            {more ? t("extras.less") : t("extras.more")}
          </button>
        </div>
      ) : null}
      {match.fields?.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("extras.fields")}>
          {match.fields.slice(0, 6).map((f) => (
            <li key={f} className="bg-muted rounded-full px-2 py-0.5 text-xs">
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      {rankings.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("extras.rankings")}>
          {rankings.map((r) => (
            <li key={`${r.system}-${r.subject}`} className="text-xs">
              <a
                href={r.source_url}
                target="_blank"
                rel="noreferrer"
                className="border-hairline-strong rounded-full border px-2 py-0.5"
              >
                {r.system.toUpperCase()} {subject(r.subject)} #{r.rank} · {r.year}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {match.cost_usd != null ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {match.net_cost_usd != null ? (
            <>
              <span className="font-semibold">
                {t("extras.netPrice", { amount: money(match.net_cost_usd, locale) })}
              </span>
              <s className="text-muted-foreground text-xs">{money(match.cost_usd, locale)}</s>
            </>
          ) : (
            <span className="font-semibold">{t("extras.grossPrice", { amount: money(match.cost_usd, locale) })}</span>
          )}
          <Info label={t("extras.estLabel")}>
            {match.net_cost_usd != null
              ? t("extras.estHow", { aid: money(match.aid_estimate_usd ?? 0, locale) })
              : t("extras.estGross")}
          </Info>
          {match.budget_fit ? (
            <span
              data-testid="budget-fit"
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                match.budget_fit === "fits" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
              )}
            >
              {t(match.budget_fit === "fits" ? "extras.fitsBudget" : "extras.aboveBudget")}
            </span>
          ) : null}
        </p>
      ) : null}
      {experience.length ? (
        <ul className="flex flex-col gap-1">
          {experience.map((e) => (
            <li key={e.key} className="flex items-center gap-2 text-xs">
              <span className="w-24">{t(`extras.experience.${e.key}`)}</span>
              <span role="img" aria-label={t("extras.score", { score: e.score })} className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={n <= e.score ? "bg-primary size-2 rounded-full" : "bg-muted size-2 rounded-full"}
                  />
                ))}
              </span>
              <Info label={t("extras.about", { name: t(`extras.experience.${e.key}`) })}>
                {e.note ?? t("extras.expHow")}
              </Info>
            </li>
          ))}
        </ul>
      ) : null}
      {match.map_url ? (
        <a href={match.map_url} target="_blank" rel="noreferrer" className="text-primary text-xs font-medium">
          {t("extras.map")}
        </a>
      ) : null}
    </div>
  )
}

function money(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}
