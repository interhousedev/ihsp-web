export type CsvCell = string | number | boolean | null | undefined

/** Spreadsheets run text that starts with one of these as a formula; a leading apostrophe keeps it text. */
const FORMULA_START = /^[=+\-@\t\r]/

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ""
  const text = typeof value === "string" ? value : String(value)
  const safe = FORMULA_START.test(text) && !/^-?\d+([.,]\d+)?$/.test(text) ? `'${text}` : text
  return /[",;\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

/** Rows to CSV text (comma separated, CRLF line ends, quotes doubled); the first row is usually the header. */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n")
}

/** Starts a browser download of `blob` under `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // The click starts the download synchronously; releasing the URL later keeps slow browsers working.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** CSV download with a UTF-8 byte order mark, so Excel reads Cyrillic and Uzbek letters correctly. */
export function downloadCsv(filename: string, rows: readonly (readonly CsvCell[])[]): void {
  downloadBlob(new Blob(["﻿", toCsv(rows)], { type: "text/csv;charset=utf-8" }), filename)
}
