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
