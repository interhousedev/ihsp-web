import type { AdmissionMatchStatus as MatchStatus } from "@ihsp/api"

export const STATUS_TONE = { safety: "success", target: "primary", reach: "warning" } as const satisfies Record<
  MatchStatus,
  "success" | "primary" | "warning"
>

export const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`

export const usd = (amount: number): string =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
