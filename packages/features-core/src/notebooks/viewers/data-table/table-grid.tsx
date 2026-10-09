"use client"

import type { DataTableContent, RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { RefChips } from "../../chat/ref-chips"
import { SortIcon } from "./sort-icon"
import type { IndexedRow, SortState } from "./sort-rows"

type TableGridProps = {
  title: string
  columns: DataTableContent["columns"]
  rows: readonly IndexedRow[]
  refsIndex: RefsIndex
  sort: SortState
  onSort: (key: string) => void
}

const ariaSort = (sort: SortState, key: string) =>
  sort?.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"

/**
 * The table from 768 px up: sortable headers (a button in each), a sticky header and first column, and the Sources
 * column of citation chips.
 */
export function TableGrid({ title, columns, rows, refsIndex, sort, onSort }: TableGridProps) {
  const t = useT("notebooks")
  return (
    <div className="relative max-h-[70dvh] overflow-auto rounded-lg border">
      <table className="w-full min-w-max border-collapse text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-muted sticky top-0 z-20">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={ariaSort(sort, column.key)}
                className={cn(
                  "bg-muted border-b p-0 text-start font-medium",
                  index === 0 && "sticky start-0 z-30",
                  column.type === "number" && "text-end",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSort(column.key)}
                  className={cn(
                    "hover:bg-foreground/5 focus-visible:ring-ring/50 flex min-h-11 w-full items-center gap-1.5 px-3 py-2 outline-hidden focus-visible:ring-3 focus-visible:ring-inset md:min-h-10",
                    column.type === "number" ? "justify-end" : "justify-start",
                  )}
                >
                  {column.label}
                  <SortIcon sort={sort} columnKey={column.key} />
                </button>
              </th>
            ))}
            <th scope="col" className="bg-muted border-b px-3 py-2 text-start font-medium">
              {t("table.sources")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, index }) => (
            <tr key={index} className="hover:bg-muted/40 border-b last:border-b-0">
              {columns.map((column, columnIndex) => {
                const className = cn("px-3 py-2 align-top", column.type === "number" && "text-end tabular-nums")
                const value = row.cells[column.key] ?? ""
                return columnIndex === 0 ? (
                  <th
                    key={column.key}
                    scope="row"
                    className={cn(className, "bg-background sticky start-0 z-10 font-medium")}
                  >
                    {value}
                  </th>
                ) : (
                  <td key={column.key} className={className}>
                    {value}
                  </td>
                )
              })}
              <td className="px-3 py-2 align-top">
                <RefChips refs={row.refs} refsIndex={refsIndex} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
