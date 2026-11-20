"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, StateView } from "@ihsp/ui"
import Link from "next/link"
import { useEffect } from "react"
import { CSS_PROFILE_URL } from "../types"
import { useBudget } from "../hooks"
import { AttendCosts } from "./attend-costs"
import { BudgetTotals } from "./budget-totals"
import { FeeRow } from "./fee-row"

/** "Cost to apply" per list entry, the totals, "Cost to attend", and the way on to the essays. */
export function BudgetView({ onViewed }: { onViewed?: () => void }) {
  const t = useT("budget")
  const query = useBudget()
  const seen = query.data !== undefined && query.data.rows.length > 0
  useEffect(() => {
    if (seen) onViewed?.()
  }, [seen, onViewed])
  if (query.isPending) return <StateView state="loading" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const { rows, totals } = query.data
  if (!rows.length)
    return (
      <StateView
        state="empty"
        emptyText={t("empty")}
        action={
          <Link href="/chooser/?step=match" className={buttonVariants()}>
            {t("emptyAction")}
          </Link>
        }
      />
    )
  const unknown = totals.unknown_fee_count > 0 || rows.some((row) => !row.aid_forms_known)
  const css = rows.some((row) => row.aid_forms.includes("css_profile"))
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
      {unknown ? (
        <section aria-label={t("check.title")} className="flex flex-col gap-1 text-sm">
          <h2 className="text-base font-semibold">{t("check.title")}</h2>
          {css ? (
            <a
              href={CSS_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {t("check.css")}
            </a>
          ) : (
            <p className="text-muted-foreground">{t("check.generic")}</p>
          )}
        </section>
      ) : null}
      <AttendCosts rows={rows} />
    </div>
  )
}
