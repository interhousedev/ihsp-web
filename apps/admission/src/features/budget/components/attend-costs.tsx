"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { formatCurrency } from "../../chooser/components/money"
import type { BudgetRow } from "../types"

/** "Cost to attend": annual cost, expected aid and the gap per university; hidden when no row carries amounts. */
export function AttendCosts({ rows }: { rows: BudgetRow[] }) {
  const t = useT("budget")
  const locale = useLocale()
  const withCost = rows.filter((row) => row.cost_to_attend)
  if (!withCost.length) return null
  return (
    <section aria-label={t("attend.title")} className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{t("attend.title")}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="text-muted-foreground text-xs">
            <tr>
              <th className="py-2 pr-3 font-medium">{t("attend.university")}</th>
              <th className="py-2 pr-3 font-medium">{t("attend.annual")}</th>
              <th className="py-2 pr-3 font-medium">{t("attend.aid")}</th>
              <th className="py-2 font-medium">{t("attend.gap")}</th>
            </tr>
          </thead>
          <tbody>
            {withCost.map((row) => {
              const cost = row.cost_to_attend!
              const money = (value: string | null) =>
                value === null ? "—" : (formatCurrency(value, cost.currency, locale) ?? value)
              return (
                <tr key={row.entry_id} className="border-t">
                  <th scope="row" className="py-2 pr-3 font-medium">
                    {row.institution.name}
                  </th>
                  <td className="py-2 pr-3">{money(cost.annual_cost)}</td>
                  <td className="py-2 pr-3">{money(cost.aid_estimate)}</td>
                  <td className="py-2">{money(cost.gap)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
