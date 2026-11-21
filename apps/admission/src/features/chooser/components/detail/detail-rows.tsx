"use client"

import type { AdmissionDetailRow } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { moneyText } from "../money"

/** One section as a two-column key/value table: muted label and value; the section's source is one line under it. */
export function DetailRows({ rows, label }: { rows: AdmissionDetailRow[]; label: string }) {
  const locale = useLocale()
  return (
    <dl aria-label={label} className="border-hairline-strong rounded-card divide-y border text-sm">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-0.5 px-3 py-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="min-w-0 font-medium break-words">{moneyText(row, locale)}</dd>
        </div>
      ))}
    </dl>
  )
}
