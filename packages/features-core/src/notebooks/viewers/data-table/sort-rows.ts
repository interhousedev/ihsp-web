// Client-side sorting of the data table (docs/reference/notebooklm.md § 3.4.5): text, number and date columns.

import type { DataTableContent } from "@ihsp/api"

type Column = DataTableContent["columns"][number]
type Row = DataTableContent["rows"][number]

export type SortState = { key: string; direction: "asc" | "desc" } | null

/** A row together with its place in the stored table (rows have no ids of their own). */
export type IndexedRow = { row: Row; index: number }

/** Clicking a header: ascending, then descending, then back to the stored order. Another column starts ascending. */
export function nextSort(current: SortState, key: string): SortState {
  if (!current || current.key !== key) return { key, direction: "asc" }
  return current.direction === "asc" ? { key, direction: "desc" } : null
}

/**
 * The number in a cell: "12", "-3.5", "1 200,5", "1,200.5", "45%", "$4". The decimal sign is the last "," or "." when
 * both occur; a "," or "." that repeats ("1,234,567") is a thousands separator, a single one is a decimal sign.
 */
export function parseNumber(value: string): number | null {
  const match = /-?\d[\d\s .,]*/.exec(value)
  if (!match) return null
  let text = match[0].replace(/[\s ]/g, "").replace(/[.,]+$/, "")
  const negative = value.trim().startsWith("-") || text.startsWith("-")
  text = text.replace(/^-/, "")
  const comma = text.lastIndexOf(",")
  const dot = text.lastIndexOf(".")
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : "."
    const thousands = decimal === "," ? "." : ","
    text = text.replaceAll(thousands, "").replace(decimal, ".")
  } else if (comma >= 0 || dot >= 0) {
    const sign = comma >= 0 ? "," : "."
    const count = text.split(sign).length - 1
    text = count > 1 ? text.replaceAll(sign, "") : text.replace(sign, ".")
  }
  const number = Number(text)
  return Number.isFinite(number) ? (negative ? -number : number) : null
}

/** A date as a UTC timestamp: ISO dates, day-first "05.03.1873" and "5/3/1873", "1873", "03.1873" and English dates. */
export function parseDate(value: string): number | null {
  const text = value.trim()
  const iso = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/.exec(text)
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3] ?? 1))
  const dayFirst = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text)
  if (dayFirst) return Date.UTC(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]))
  const monthYear = /^(\d{1,2})[./](\d{4})$/.exec(text)
  if (monthYear) return Date.UTC(Number(monthYear[2]), Number(monthYear[1]) - 1, 1)
  const year = /^(\d{4})$/.exec(text)
  if (year) return Date.UTC(Number(year[1]), 0, 1)
  const parsed = Date.parse(text)
  return Number.isNaN(parsed) ? null : parsed
}

function keyOf(column: Column, text: string): number | string | null {
  if (text.trim() === "") return null
  if (column.type === "number") return parseNumber(text)
  if (column.type === "date") return parseDate(text)
  return text
}

/**
 * The rows sorted by a column (stable, so equal cells keep the stored order). Empty and unreadable cells go last in
 * both directions. Without a sort the stored order is kept.
 */
export function sortRows(
  rows: readonly Row[],
  columns: readonly Column[],
  sort: SortState,
  locale: string,
): IndexedRow[] {
  const indexed = rows.map((row, index) => ({ row, index }))
  const column = sort ? columns.find((item) => item.key === sort.key) : undefined
  if (!sort || !column) return indexed
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: "base" })
  const sign = sort.direction === "asc" ? 1 : -1
  return indexed
    .map((item) => ({ item, key: keyOf(column, item.row.cells[column.key] ?? "") }))
    .toSorted((a, b) => {
      if (a.key === null || b.key === null) {
        if (a.key === b.key) return a.item.index - b.item.index
        return a.key === null ? 1 : -1
      }
      const order =
        typeof a.key === "number" && typeof b.key === "number"
          ? a.key - b.key
          : collator.compare(String(a.key), String(b.key))
      return order !== 0 ? sign * order : a.item.index - b.item.index
    })
    .map(({ item }) => item)
}
