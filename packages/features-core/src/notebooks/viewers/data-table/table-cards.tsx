"use client"

import type { DataTableContent, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { RefChips } from "../../chat/ref-chips"
import type { IndexedRow } from "./sort-rows"

type TableCardsProps = {
  columns: DataTableContent["columns"]
  rows: readonly IndexedRow[]
  refsIndex: RefsIndex
}

/** The table on a phone: every row is a card of label and value pairs, with its sources at the bottom. */
export function TableCards({ columns, rows, refsIndex }: TableCardsProps) {
  const t = useT("notebooks")
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ row, index }) => (
        <li key={index} className="bg-card rounded-xl border p-4">
          <dl className="flex flex-col gap-2">
            {columns.map((column, columnIndex) => (
              <div key={column.key} className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground text-xs">{column.label}</dt>
                <dd className={columnIndex === 0 ? "text-base font-semibold" : "text-sm"}>
                  {row.cells[column.key] ?? ""}
                </dd>
              </div>
            ))}
            {row.refs.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-muted-foreground text-xs">{t("table.sources")}</dt>
                <dd>
                  <RefChips refs={row.refs} refsIndex={refsIndex} />
                </dd>
              </div>
            ) : null}
          </dl>
        </li>
      ))}
    </ul>
  )
}
