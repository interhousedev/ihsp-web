import { usd } from "../limits/utils"

/** Millionths of a US dollar (the ledger's `cost_micro`) as dollars in the admin's locale. */
export function micro(value: number, locale = "en"): string {
  return usd(value / 1_000_000, locale)
}

/** A decimal average with at most one fraction digit, in the admin's locale. */
export function average(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
}

/** The last two dot-separated parts of a request id (`notebooks.studio_quiz.main` → `studio_quiz.main`). */
export function shortRequest(id: string): string {
  return id.split(".").slice(-2).join(".")
}

/** The pipeline that only takes search connectors. */
export const SEARCH_PIPELINE = "web_search"
export const REASONING = ["none", "minimal", "low", "medium", "high"] as const
