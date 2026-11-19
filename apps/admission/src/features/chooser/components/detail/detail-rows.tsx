"use client"

import type { AdmissionDetailRow } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { SourceChip } from "../fact-source"
import { moneyText } from "../money"

/** One section as a two-column key/value table: muted label, value, and where the value comes from. */
export function DetailRows({ rows, label }: { rows: AdmissionDetailRow[]; label: string }) {
  const locale = useLocale()
  return (
    <dl aria-label={label} className="border-hairline-strong rounded-card divide-y border text-sm">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="flex min-w-0 flex-col gap-1.5 sm:items-start">
            <span className="font-medium break-words">{moneyText(row, locale)}</span>
            <SourceChip url={row.source_url} year={row.year} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
