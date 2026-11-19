import type { AdmissionBudget } from "@ihsp/api"

/** Shapes of `GET /v1/admission/chooser/budget` (`BudgetOut` of the OpenAPI document). */
export type FeeStatus = "unpaid" | "paid" | "waiver_requested" | "waiver_approved"
export type AidForm = "css_profile" | "fafsa" | "idoc" | "institutional"

export type Budget = AdmissionBudget
export type BudgetRow = Budget["rows"][number]
export type CurrencyTotal = Budget["totals"]["by_currency"][number]

export const FEE_STATUSES: readonly FeeStatus[] = ["unpaid", "paid", "waiver_requested", "waiver_approved"]
export const CSS_PROFILE_URL = "https://cssprofile.collegeboard.org/"
