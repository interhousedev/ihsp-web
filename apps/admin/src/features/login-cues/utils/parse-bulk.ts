/** One pasted line that parsed: the EMIS login (digits) and the full name. */
export type BulkCue = { emis_login: string; full_name: string }

/** A line that did not parse; `line` is 1-based, `reason` says which part is wrong. */
export type BulkLineError = { line: number; reason: "format" | "login" }

export type BulkParseResult = { items: BulkCue[]; errors: BulkLineError[] }

const DIGITS = /^\d+$/

/**
 * Parses pasted lines `login;full name` (one cue per line). Blank lines are skipped; the split is on the first `;`,
 * so a name may contain semicolons. The login must be digits only.
 */
export function parseBulkLines(text: string): BulkParseResult {
  const items: BulkCue[] = []
  const errors: BulkLineError[] = []
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (line === "") return
    const separator = line.indexOf(";")
    if (separator === -1) {
      errors.push({ line: index + 1, reason: "format" })
      return
    }
    const emisLogin = line.slice(0, separator).trim()
    const fullName = line.slice(separator + 1).trim()
    if (!DIGITS.test(emisLogin)) {
      errors.push({ line: index + 1, reason: "login" })
      return
    }
    if (fullName === "") {
      errors.push({ line: index + 1, reason: "format" })
      return
    }
    items.push({ emis_login: emisLogin, full_name: fullName })
  })
  return { items, errors }
}

const CSV_SEPARATOR = /[;\t,]/

/**
 * Turns an uploaded CSV/TSV/TXT file (`login,full name`, `login;full name` or tab-separated; Excel "Save as CSV")
 * into the pasted-lines format. A first row whose login cell is not digits is a header and is dropped; quotes around
 * cells are removed.
 */
export function fileTextToBulkLines(content: string): string {
  const unquote = (cell: string) =>
    cell
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replaceAll('""', '"')
      .trim()
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/)
  const out: string[] = []
  lines.forEach((raw, index) => {
    const line = raw.trim()
    if (line === "") return
    const match = CSV_SEPARATOR.exec(line)
    if (match === null) {
      out.push(line)
      return
    }
    const login = unquote(line.slice(0, match.index))
    const name = unquote(line.slice(match.index + 1))
      .replace(/[;\t,]+$/, "")
      .trim()
    if (index === 0 && !DIGITS.test(login)) return
    out.push(`${login};${name}`)
  })
  return out.join("\n")
}
