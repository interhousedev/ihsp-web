// CSV and TSV for the Studio downloads (flash cards, data table). CSV is UTF-8 with a BOM so Excel reads Cyrillic.

const BOM = "﻿"

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

/** Rows to CSV text (CRLF line ends); fields with commas, quotes or line breaks are quoted. */
export function toCsv(rows: readonly (readonly string[])[], options: { bom?: boolean } = {}): string {
  const body = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")
  return options.bom === false ? body : `${BOM}${body}`
}

/** Rows to TSV for pasting into a spreadsheet: tabs and line breaks inside a cell become spaces. */
export function toTsv(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map((cell) => cell.replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n")
}
