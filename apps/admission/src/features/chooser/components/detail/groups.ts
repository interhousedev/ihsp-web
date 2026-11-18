import type { AdmissionDetailGroup, AdmissionDetailRow } from "@ihsp/api"

/** The sections of the school page, in display order; names match the backend fact groups. */
export const DETAIL_GROUPS = [
  "overview",
  "selectivity",
  "costs",
  "english",
  "credentials",
  "application",
  "visa",
] as const
export type DetailGroupKey = (typeof DETAIL_GROUPS)[number]

export function rowsOf(details: AdmissionDetailGroup[], group: string): AdmissionDetailRow[] {
  return details.find((item) => item.key === group)?.rows ?? []
}

export function rowText(details: AdmissionDetailGroup[], key: string): string | null {
  for (const group of details) {
    const row = group.rows.find((item) => item.key === key)
    if (row?.value_text) return row.value_text
  }
  return null
}
