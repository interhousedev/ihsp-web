"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useBudget } from "../hooks"
import { AttendCosts } from "./attend-costs"
import { BudgetTotals } from "./budget-totals"
import { FeeRow } from "./fee-row"

/** "Cost to apply" per list entry, the totals, "Cost to attend", and the way on to the essays. */
export function BudgetView() {
  const t = useT("budget")
  const query = useBudget()
  if (query.isPending) return <StateView state="loading" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const { rows, totals } = query.data
  if (!rows.length)
    return (
      <StateView
        state="empty"
        emptyText={t("empty")}
        action={
          <Link href="/chooser/search/" className={buttonVariants()}>
            {t("emptyAction")}
          </Link>
        }
      />
    )
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section aria-label={t("apply.title")} className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("apply.title")}</h2>
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <FeeRow key={row.entry_id} row={row} />
          ))}
        </ul>
      </section>
      <BudgetTotals totals={totals} />
      <AttendCosts rows={rows} />
      <div>
        <Link href="/essays/?tab=colleges" className={buttonVariants()}>
          {t("startEssays", { count: rows.length })}
        </Link>
      </div>
    </div>
  )
}
