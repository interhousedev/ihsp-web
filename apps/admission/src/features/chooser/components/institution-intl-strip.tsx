"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import type { ReactNode } from "react"
import { formatCompactCurrency } from "./money"
import type { IntlFigures } from "./intl-figures"

function Item({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/**
 * The one strip of what an international applicant needs: admit rate, full need, average aid, yearly cost after aid
 * against the family budget and the next deadline. A figure that is not on file is left out, never filled in.
 */
export function IntlStrip({ figures, deadline }: { figures: IntlFigures; deadline: string }) {
  const t = useT("chooser")
  const list = useT("uniList")
  const locale = useLocale()
  const { admit, fullNeed, avgAid, cost, gap } = figures
  const money = (amount: number, currency: string) => formatCompactCurrency(amount, currency, locale)
  return (
    <section aria-label={t("strip.label")} className="bg-card flex flex-col gap-2 rounded-card border px-4 py-3">
      <h2 className="text-muted-foreground text-xs font-medium">{t("strip.label")}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="key-stats">
        {admit ? (
          <Item label={t(admit.overall ? "strip.admitOverall" : "strip.admit")}>
            {Math.round(admit.percent * 10) / 10}%
          </Item>
        ) : null}
        {fullNeed !== null ? <Item label={t("strip.fullNeed")}>{t(fullNeed ? "yes" : "no")}</Item> : null}
        {avgAid ? <Item label={t("strip.avgAid")}>{money(avgAid.amount, avgAid.currency)}</Item> : null}
        {cost ? (
          <Item label={t("strip.cost")} className="col-span-2 sm:col-span-1">
            <span>
              {cost.kind === "net"
                ? list("approx", { amount: money(cost.amount, cost.currency) })
                : money(cost.amount, cost.currency)}
            </span>
            {gap !== null ? (
              <span className={cn("block text-xs font-normal", gap > 0 ? "text-destructive" : "text-success")}>
                {gap > 0
                  ? list("over", { amount: money(gap, cost.currency) })
                  : list("under", { amount: money(-gap, cost.currency) })}
              </span>
            ) : null}
          </Item>
        ) : null}
        <Item label={t("detail.stats.deadline")}>{deadline}</Item>
      </dl>
    </section>
  )
}
