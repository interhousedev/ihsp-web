"use client"

import { useMatches } from "../../discover/hooks"
import { useListRows, type ListRow } from "../use-list-rows"
import { budgetGap, type Cost } from "../list-model"
import type { Institution } from "../types"

/** What an international applicant needs to know about one university, joined from the catalog and my list. */
export type IntlFigures = {
  /** International admit rate, percent 0..100; the overall rate when only that is known (`overall`). */
  admit: { percent: number; overall: boolean } | null
  fullNeed: boolean | null
  avgAid: { amount: number; currency: string } | null
  cost: Cost | null
  /** Yearly cost minus the family budget, USD; positive is over budget. */
  gap: number | null
  row: ListRow | undefined
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function fact(institution: Institution, key: string): unknown {
  return institution.facts[key]?.value ?? undefined
}

/**
 * The figures of the "for an international" strip. The numbers of my list (budget row: admit rate, average aid) win;
 * a university that is not on the list falls back to the catalog's facts and the matching feed (average aid for internationals).
 */
export function useIntlFigures(institution: Institution): IntlFigures {
  const { rows, familyBudget } = useListRows()
  const match = useMatches().data?.items.find((item) => item.university_id === institution.id)
  const row = rows.find((item) => item.entry.institution.id === institution.id)
  const budget = row?.budget
  const intlRate = num(fact(institution, "intl_acceptance_rate"))
  const overallRate = num(fact(institution, "acceptance_rate"))
  let admit: IntlFigures["admit"] = null
  if (budget?.admit_rate) admit = { percent: budget.admit_rate.percent, overall: budget.admit_rate.scope === "overall" }
  else if (intlRate !== null) admit = { percent: intlRate * 100, overall: false }
  else if (overallRate !== null) admit = { percent: overallRate * 100, overall: true }
  const profile = budget?.aid_profile
  const fullFact = fact(institution, "meets_full_need")
  const fullNeed = profile?.meets_full_need ?? (typeof fullFact === "boolean" ? fullFact : (match?.meets_full_need ?? null))
  const aidAmount = num(profile?.avg_aid) ?? num(match?.avg_aid_intl)
  const afterAid = num(institution.cost_after_aid)
  const cost: Cost | null =
    row?.cost ??
    (afterAid !== null ? { amount: afterAid, currency: institution.coa_currency ?? "USD", kind: "net" } : null)
  return {
    admit,
    fullNeed,
    avgAid: aidAmount === null ? null : { amount: aidAmount, currency: institution.coa_currency ?? "USD" },
    cost,
    gap: row ? row.gap : budgetGap(cost, familyBudget),
    row,
  }
}
