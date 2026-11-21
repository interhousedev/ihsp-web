"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { formatCompactCurrency } from "./money"
import type { ListRows } from "../use-list-rows"

/** The footer of the table: how many universities fit the family budget, by how much the others miss it, how many are unpriced. */
export function ListTotals({ data }: { data: Pick<ListRows, "familyBudget" | "totals" | "rows"> }) {
  const t = useT("uniList")
  const locale = useLocale()
  const { familyBudget, totals, rows } = data
  const usd = (value: number) => formatCompactCurrency(value, "USD", locale)
  return (
    <section
      aria-label={t("totals.title")}
      className="bg-muted/40 flex flex-wrap items-baseline gap-x-5 gap-y-1 rounded-xl border px-3 py-2.5 text-sm"
    >
      <span className="font-semibold">{t("totals.title")}</span>
      <span>{t("totals.count", { count: rows.length })}</span>
      {familyBudget === null ? (
        <span className="text-muted-foreground">{t("totals.noBudget")}</span>
      ) : (
        <>
          <span>{t("totals.budget", { amount: usd(familyBudget) })}</span>
          <span className="text-success">{t("totals.within", { count: totals.within })}</span>
          <span className={totals.over > 0 ? "text-destructive" : "text-muted-foreground"}>
            {totals.avgOver === null ? t("totals.over", { count: 0 }) : t("totals.overAvg", { count: totals.over, amount: usd(totals.avgOver) })}
          </span>
        </>
      )}
      {totals.unknown > 0 ? <span className="text-muted-foreground">{t("totals.unknown", { count: totals.unknown })}</span> : null}
    </section>
  )
}
