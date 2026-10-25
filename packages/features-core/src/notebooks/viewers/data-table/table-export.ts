import type { DataTableContent, RefsIndex } from "@ihsp/api"
import { toCsv, toTsv } from "../../lib/csv"

type Row = DataTableContent["rows"][number]

/** The header (column labels) and the cells of the rows, in the order given. */
export function tableCells(content: DataTableContent, rows: readonly Row[]): string[][] {
  return [
    content.columns.map((column) => column.label),
    ...rows.map((row) => content.columns.map((column) => row.cells[column.key] ?? "")),
  ]
}

/** "Biology 10.pdf, Page 3; Lesson 5" for the refs of a row (one entry per passage, labels that resolve to nothing are left out). */
export function sourcesText(
  refs: readonly string[],
  refsIndex: RefsIndex,
  pageLabel: (page: number) => string,
): string {
  const seen = new Set<string>()
  const parts: string[] = []
  for (const label of refs) {
    const entry = refsIndex[label]
    if (!entry || seen.has(entry.passage_id)) continue
    seen.add(entry.passage_id)
    parts.push(entry.page === null ? entry.source_title : `${entry.source_title}, ${pageLabel(entry.page)}`)
  }
  return parts.join("; ")
}

/** For pasting into a spreadsheet: the header and the cells, tab separated. */
export function tableToTsv(content: DataTableContent, rows: readonly Row[]): string {
  return toTsv(tableCells(content, rows))
}

/** For Excel: UTF-8 with BOM, the cells and an extra last column with the source titles and pages of each row. */
export function tableToCsv(
  content: DataTableContent,
  rows: readonly Row[],
  refsIndex: RefsIndex,
  sourcesLabel: string,
  pageLabel: (page: number) => string,
): string {
  const [header = [], ...body] = tableCells(content, rows)
  return toCsv([
    [...header, sourcesLabel],
    ...body.map((cells, index) => [...cells, sourcesText(rows[index]?.refs ?? [], refsIndex, pageLabel)]),
  ])
}
