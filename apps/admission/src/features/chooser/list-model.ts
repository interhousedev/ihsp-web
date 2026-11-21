import type { BudgetRow } from "../budget/types"
import type { ListEntry } from "./types"

/** More universities than this is a warning, not a block: a long list means thin applications. */
export const LIST_SOFT_CAP = 12

/** Upper bound of the family budget answers of the survey, in USD a year; `any` has no bound. */
const FAMILY_BUDGET_USD: Record<string, number> = { under_10k: 10_000, under_30k: 30_000, under_50k: 50_000 }

/** The yearly family budget from the survey answer, or `null` when there is none (or it is `any`). */
export function familyBudgetUsd(answer: string | null | undefined): number | null {
  return (answer && FAMILY_BUDGET_USD[answer]) || null
}

/** Universities of the student's home country: the safe choice whatever the numbers say. */
export function isHome(country: string | null | undefined): boolean {
  const value = (country ?? "").trim().toLowerCase()
  return value === "uzbekistan" || value === "uz" || value === "ўзбекистон" || value === "узбекистан"
}

/** How sure the yearly figure is: an estimate after aid, or only the sticker price. */
export type CostKind = "net" | "sticker"
export type Cost = { amount: number; currency: string; kind: CostKind }

const num = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * The yearly cost after aid, as well as it is known. In order: the budget row's cost minus the aid estimate, minus the
 * average aid of the university; the catalog's "cost after aid"; the sticker price (marked as such); `null`.
 */
export function netCost(entry: ListEntry, row: BudgetRow | undefined): Cost | null {
  const attend = row?.cost_to_attend
  const annual = num(attend?.annual_cost)
  if (attend && annual !== null) {
    const currency = attend.currency || "USD"
    const aid = num(attend.aid_estimate) ?? num(row?.aid_profile?.avg_aid)
    return aid === null
      ? { amount: annual, currency, kind: "sticker" }
      : { amount: Math.max(annual - aid, 0), currency, kind: "net" }
  }
  const currency = entry.institution.coa_currency ?? "USD"
  const after = num(entry.institution.cost_after_aid)
  if (after !== null) return { amount: after, currency, kind: "net" }
  const sticker = num(entry.institution.coa_total)
  return sticker === null ? null : { amount: sticker, currency, kind: "sticker" }
}

/** Yearly cost minus the family budget (positive: over budget); `null` when either side or the currency is unknown. */
export function budgetGap(cost: Cost | null, budget: number | null): number | null {
  if (!cost || budget === null || cost.currency !== "USD") return null
  return Math.round(cost.amount - budget)
}

/** Admission chance for the scatter plot, 0..100: the middle of the estimate's range, else the admit rate. */
export function chancePercent(entry: ListEntry, row: BudgetRow | undefined): number | null {
  const { low, high, range_visible: visible } = entry.estimate
  if (visible && low !== null && high !== null) return (low + high) / 2
  return row?.admit_rate?.percent ?? null
}

export type ListTotals = {
  /** Entries with a known yearly cost in USD. */
  priced: number
  /** In budget / over budget, among those with a gap. */
  within: number
  over: number
  /** Average gap in USD a year over the entries that are over budget; `null` when none. */
  avgOver: number | null
  /** Entries without any cost. */
  unknown: number
}

export function totals(gaps: readonly (number | null)[], costs: readonly (Cost | null)[]): ListTotals {
  const known = gaps.filter((gap): gap is number => gap !== null)
  const over = known.filter((gap) => gap > 0)
  return {
    priced: costs.filter((cost) => cost !== null).length,
    within: known.length - over.length,
    over: over.length,
    avgOver: over.length ? Math.round(over.reduce((sum, gap) => sum + gap, 0) / over.length) : null,
    unknown: costs.filter((cost) => cost === null).length,
  }
}

/** `reach`, `target`, `safety`; a home university is its own label ("safe at home") in the table. */
export type RowLabel = "reach" | "target" | "safety" | "home" | null

export function rowLabel(effective: string | null | undefined, country: string | null | undefined): RowLabel {
  if (isHome(country)) return "home"
  return effective === "reach" || effective === "target" || effective === "safety" ? effective : null
}

/** Where a figure of the row comes from, for the "unverified · AI · source" line; `null` when the catalog verified it. */
export type Provenance = { sourceUrl: string | null }

/** The catalog's figures are AI-gathered until somebody verifies them; the first source on file is shown. */
export function provenance(entry: ListEntry): Provenance | null {
  if (entry.institution.verified) return null
  return { sourceUrl: entry.institution.sources.find((source) => source.url)?.url ?? null }
}

/** What the row lacks and the AI research could look up: the yearly cost, the chosen round's deadline, the chance. */
export type Missing = "cost" | "deadline" | "chance"

export function missingFacts(cost: Cost | null, chance: number | null, deadline: string | null): Missing[] {
  const missing: Missing[] = []
  if (cost === null) missing.push("cost")
  if (deadline === null) missing.push("deadline")
  if (chance === null) missing.push("chance")
  return missing
}
