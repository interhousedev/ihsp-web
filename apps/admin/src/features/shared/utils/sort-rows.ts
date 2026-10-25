import type { ColumnDef, SortingState } from "@tanstack/react-table"

export type SortValue = string | number | boolean | null | undefined

function isEmpty(value: SortValue): boolean {
  return value === null || value === undefined || value === ""
}

function valueOf<T>(column: ColumnDef<T, unknown> | undefined, row: T, index: number): SortValue {
  const accessor = column && "accessorFn" in column ? column.accessorFn : undefined
  if (!accessor) return null
  const value: unknown = accessor(row, index)
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null
}

/** Compares two non-empty values: numbers and booleans by value, everything else as text of the locale. */
function compare(a: SortValue, b: SortValue, locale: string): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b)
  return String(a).localeCompare(String(b), locale, { numeric: true, sensitivity: "base" })
}

/**
 * Sorts loaded rows by the table's sorting state using the columns' `accessorFn`. The admin list endpoints have no
 * `sort` parameter, so only what is loaded is sorted. A stable copy; empty values ("—") go last in both directions.
 */
export function sortRows<T>(
  items: readonly T[],
  sorting: SortingState,
  columns: readonly ColumnDef<T, unknown>[],
  locale = "en",
): T[] {
  if (sorting.length === 0) return [...items]
  const keyed = items.map((row, index) => ({ row, index }))
  keyed.sort((left, right) => {
    for (const sort of sorting) {
      const column = columns.find((item) => item.id === sort.id)
      const a = valueOf(column, left.row, left.index)
      const b = valueOf(column, right.row, right.index)
      if (isEmpty(a) || isEmpty(b)) {
        if (isEmpty(a) && isEmpty(b)) continue
        return isEmpty(a) ? 1 : -1
      }
      const result = compare(a, b, locale)
      if (result !== 0) return sort.desc ? -result : result
    }
    return left.index - right.index
  })
  return keyed.map((item) => item.row)
}
