"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn, Dialog, DialogContent, DialogHeader, DialogTitle } from "@ihsp/ui"
import { useState } from "react"
import type { AdmissionMatch } from "@ihsp/api"
import { InstitutionFocuses } from "../../../components/lib/institution-focuses"

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

type Section = "focuses" | "costs" | "rankings"

const MAX_CHIPS = 4

/** The ranking worth a glance on the card: QS overall, else any QS, else the first one the data holds. */
export function headlineRanking(rankings: CardMatch["rankings"]): NonNullable<CardMatch["rankings"]>[number] | null {
  const list = rankings ?? []
  return list.find((r) => r.system === "qs" && r.subject === "overall") ?? list.find((r) => r.system === "qs") ?? list[0] ?? null
}

/**
 * The compact part of a match card: description, a few field chips, the headline ranking and rows that open the long
 * sections (what the college looks for, costs and scores, rankings and subjects) in centred pop-ups, so a heavy card
 * never outgrows its frame.
 */
export function MatchExtrasView({ match }: { match: CardMatch }) {
  const t = useT("discover")
  const locale = useLocale()
  const [open, setOpen] = useState<Section | null>(null)
  const rankings = match.rankings ?? []
  const headline = headlineRanking(rankings)
  const fields = match.fields ?? []
  const experience = (match.experience ?? []).filter((e) => e.score >= 1 && e.score <= 5)
  const focuses = match.focuses ?? []
  const subject = (slug: string) =>
    t.has(`extras.subjects.${slug}`) ? t(`extras.subjects.${slug}`) : slug.replaceAll("_", " ")
  const rankLabel = (r: NonNullable<CardMatch["rankings"]>[number]) =>
    r.subject === "overall"
      ? `${r.system.toUpperCase()} #${r.rank} · ${r.year}`
      : `${r.system.toUpperCase()} ${subject(r.subject)} #${r.rank} · ${r.year}`
  const hasCosts = match.cost_usd != null || experience.length > 0 || Boolean(match.map_url)
  const rows: { section: Section; label: string }[] = []
  if (focuses.length) rows.push({ section: "focuses", label: t("extras.looksFor", { count: focuses.length }) })
  if (hasCosts) rows.push({ section: "costs", label: t("extras.costsRow") })
  if (rankings.length || fields.length > MAX_CHIPS)
    rows.push({ section: "rankings", label: t("extras.rankingsRow") })
  const title =
    open === "focuses" ? t("extras.looksForTitle", { name: match.name }) : open === "costs" ? t("extras.costsTitle") : t("extras.rankingsRow")
  return (
    <div className="flex min-h-0 flex-col gap-2">
      {match.description ? <p className="line-clamp-2 text-sm">{match.description}</p> : null}
      {fields.length || headline ? (
        <ul className="flex flex-wrap gap-1.5 overflow-hidden" aria-label={t("extras.fields")}>
          {headline ? (
            <li className="bg-primary/10 text-primary max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium">
              {rankLabel(headline)}
            </li>
          ) : null}
          {fields.slice(0, MAX_CHIPS).map((f) => (
            <li key={f} className="bg-muted max-w-full truncate rounded-full px-2 py-0.5 text-xs">
              {f}
            </li>
          ))}
          {fields.length > MAX_CHIPS ? (
            <li>
              <button
                type="button"
                onClick={() => setOpen("rankings")}
                className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium"
              >
                +{fields.length - MAX_CHIPS}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      {rows.length ? (
        <div className="flex flex-wrap gap-1.5">
          {rows.map((row) => (
            <button
              key={row.section}
              type="button"
              onClick={() => setOpen(row.section)}
              className="border-hairline-strong text-primary hover:bg-muted min-h-8 rounded-full border px-3 text-xs font-medium"
            >
              {row.label} ›
            </button>
          ))}
        </div>
      ) : null}
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="max-sm:top-1/2 max-sm:bottom-auto max-sm:max-h-[calc(100dvh-2rem)] max-sm:w-full max-sm:max-w-[calc(100%-2rem)] max-sm:-translate-y-1/2 max-sm:rounded-b-panel max-sm:pb-5 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className={cn("pe-8", open === "focuses" && "sr-only")}>{title}</DialogTitle>
          </DialogHeader>
          {open === "focuses" ? <InstitutionFocuses name={match.name} focuses={match.focuses} /> : null}
          {open === "costs" ? (
            <div className="flex flex-col gap-3">
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
                    <span className="font-semibold">
                      {t("extras.grossPrice", { amount: money(match.cost_usd, locale) })}
                    </span>
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
                      <span className="w-28">{t(`extras.experience.${e.key}`)}</span>
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
                <a href={match.map_url} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium">
                  {t("extras.map")}
                </a>
              ) : null}
            </div>
          ) : null}
          {open === "rankings" ? (
            <div className="flex flex-col gap-3">
              {rankings.length ? (
                <ul className="flex flex-col gap-1.5" aria-label={t("extras.rankings")}>
                  {rankings.map((r) => (
                    <li key={`${r.system}-${r.subject}`} className="text-sm">
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {rankLabel(r)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {fields.length ? (
                <ul className="flex flex-wrap gap-1.5" aria-label={t("extras.fields")}>
                  {fields.map((f) => (
                    <li key={f} className="bg-muted rounded-full px-2 py-0.5 text-xs">
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function money(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}
