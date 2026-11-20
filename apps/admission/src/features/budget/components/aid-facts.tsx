"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { SourceChip } from "../../chooser/components/fact-source"
import { formatCurrency } from "../../chooser/components/money"
import type { BudgetRow } from "../types"

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

const BARS = [
  { key: "grant", color: "bg-success" },
  { key: "loan", color: "bg-warning" },
  { key: "work", color: "bg-primary" },
] as const

/**
 * How the aid of one university meets need: full need (yes / no / unknown), the grant, loan and work shares, the average
 * aid and the admit rate with whom they describe (international or overall), and the source. Unknown is "no data".
 */
export function AidFacts({ row }: { row: BudgetRow }) {
  const t = useT("budget")
  const locale = useLocale()
  const aid = row.aid_profile
  const rate = row.admit_rate
  const none = t("aid.noData")
  const shares = { grant: aid?.grant_pct ?? null, loan: aid?.loan_pct ?? null, work: aid?.work_pct ?? null }
  const known = Object.values(shares).some((value) => value !== null)
  const avg = aid?.avg_aid ? formatCurrency(Number(aid.avg_aid), "USD", locale) : null
  const need = aid?.meets_full_need
  return (
    <section aria-label={t("aid.title")} className="flex flex-col gap-3 border-t pt-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Fact label={t("aid.meetsNeed")}>
          {need == null ? <span className="text-muted-foreground">{none}</span> : need ? t("aid.yes") : t("aid.no")}
        </Fact>
        <Fact label={aid?.avg_aid_scope ? t("aid.avgAid", { scope: t(`aid.scope.${aid.avg_aid_scope}`) }) : t("aid.avgAidPlain")}>
          {avg ?? <span className="text-muted-foreground">{none}</span>}
        </Fact>
        <Fact label={rate ? t("aid.admit", { scope: t(`aid.scope.${rate.scope}`) }) : t("aid.admitPlain")}>
          {rate ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(rate.percent)}%` : <span className="text-muted-foreground">{none}</span>}
        </Fact>
      </dl>
      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-xs">{t("aid.composition")}</p>
        {known ? (
          <>
            <div role="img" aria-label={BARS.map(({ key }) => `${t(`aid.${key}`)} ${shares[key] ?? 0}%`).join(", ")} className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {BARS.map(({ key, color }) =>
                shares[key] ? <span key={key} style={{ flexGrow: shares[key] ?? 0 }} className={cn("min-w-1", color)} /> : null,
              )}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {BARS.map(({ key }) => (
                <li key={key}>
                  {t(`aid.${key}`)} {shares[key] === null ? none : `${shares[key]}%`}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">{none}</p>
        )}
      </div>
      {aid?.source_url || rate?.source_url ? (
        <SourceChip
          url={aid?.source_url ?? rate?.source_url ?? null}
          year={aid?.year ?? rate?.year ?? null}
          cycle={aid?.year != null}
        />
      ) : null}
    </section>
  )
}
