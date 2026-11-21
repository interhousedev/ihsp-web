"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { useFitAnalysis } from "../../fit/api"
import { FitAnalysisPanel } from "../../fit/components/fit-analysis"
import { withAnalysis } from "../../fit/fit-model"
import { FitBreakdown } from "../../fit/components/fit-breakdown"
import { FitRing } from "../../fit/components/fit-ring"
import { RingLogo } from "../../fit/components/ring-logo"
import { useListRows, type ListRow } from "../use-list-rows"
import { formatCompactCurrency, formatCurrency } from "./money"

/** The institution's row of my list (fit, cost after aid, gap), `undefined` while it is not on the list. */
export function useInstitutionRow(institutionId: string): ListRow | undefined {
  return useListRows().rows.find((row) => row.entry.institution.id === institutionId)
}

/** Yearly cost the way the table writes it: "≈" for an after-aid estimate, a marked sticker price otherwise. */
export function CostText({ row }: { row: ListRow }) {
  const t = useT("uniList")
  const locale = useLocale()
  if (!row.cost) return <>{t("detail.noCost")}</>
  const amount = formatCurrency(row.cost.amount, row.cost.currency, locale) ?? String(row.cost.amount)
  return row.cost.kind === "net" ? <>≈ {amount}</> : <>{t("detail.sticker", { value: amount })}</>
}

/**
 * Fit with me for a university on my list: the same ring as the table around the circular logo, the breakdown with
 * the reasons and the steps that raise it, and the yearly cost after aid with the gap to the family budget.
 */
export function InstitutionFit({ row }: { row: ListRow }) {
  const t = useT("uniList")
  const locale = useLocale()
  const { institution } = row.entry
  const analysis = useFitAnalysis(institution.id)
  const researched = row.missing.length === 0
  const fit = analysis.data?.ai ? withAnalysis(row.fit, analysis.data) : row.fit
  /** Until the research has filled the facts the number is an estimate over the known axes. */
  const approx = !researched || (row.fit.knownShare ?? 1) < 0.999
  return (
    <section
      aria-label={t("detail.title")}
      className="bg-card flex flex-col gap-4 rounded-3xl border p-4 md:p-6"
      data-testid="institution-fit"
    >
      <div className="flex items-center gap-4">
        <FitRing metrics={fit.metrics} size={88}>
          <RingLogo name={institution.name} src={institution.logo_url} />
        </FitRing>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-semibold">{t("detail.title")}</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">{t("detail.afterAid")} </span>
            <span className="font-semibold tabular-nums">
              <CostText row={row} />
            </span>
          </p>
          {row.gap !== null ? (
            <p className={row.gap > 0 ? "text-destructive text-sm" : "text-success text-sm"}>
              {row.gap > 0
                ? t("detail.over", { value: formatCompactCurrency(row.gap, "USD", locale) })
                : t("detail.within", { value: formatCompactCurrency(-row.gap, "USD", locale) })}
            </p>
          ) : null}
        </div>
      </div>
      <FitBreakdown name={institution.name} fit={fit} approx={approx} full />
      <FitAnalysisPanel analysis={analysis} auto={researched} />
    </section>
  )
}
