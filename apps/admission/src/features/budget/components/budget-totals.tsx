"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { formatCurrency } from "../../chooser/components/money"
import { CSS_PROFILE_URL, type Budget } from "../types"

/** Fee totals per currency (never summed across currencies), the unknown-fee count and the shared CSS Profile line. */
export function BudgetTotals({ totals }: { totals: Budget["totals"] }) {
  const t = useT("budget")
  const locale = useLocale()
  const money = (value: string, currency: string) => formatCurrency(value, currency, locale) ?? value
  return (
    <section
      aria-label={t("totals.title")}
      className="bg-card border-hairline-strong rounded-card flex flex-col gap-3 border p-4"
    >
      <h2 className="text-base font-semibold">{t("totals.title")}</h2>
      <ul className="flex flex-col gap-2">
        {totals.by_currency.map((row) => (
          <li key={row.currency} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="text-base font-semibold">{money(row.known_total, row.currency)}</span>
            <span className="text-muted-foreground">
              {t("totals.paid", { amount: money(row.paid_total, row.currency) })}
            </span>
            <span className="text-muted-foreground">
              {t("totals.waived", { amount: money(row.waived_total, row.currency) })}
            </span>
          </li>
        ))}
      </ul>
      {totals.unknown_fee_count > 0 ? (
        <p className="text-muted-foreground text-sm">{t("totals.unknown", { count: totals.unknown_fee_count })}</p>
      ) : null}
      {totals.css_profile_schools > 0 ? (
        <p className="text-sm">
          <a href={CSS_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {t("totals.cssProfile", { count: totals.css_profile_schools })}
          </a>
        </p>
      ) : null}
    </section>
  )
}
