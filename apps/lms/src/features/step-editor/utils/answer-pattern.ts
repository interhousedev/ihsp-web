/** The friendly pattern kinds of a text answer; "advanced" is a raw regular expression. */
export type PatternMode = "exact" | "contains" | "startsWith" | "endsWith" | "advanced"

const META = /[.*+?^${}()|[\]\\]/g
const LITERAL = /^(?:[^.*+?^${}()|[\]\\]|\\[.*+?^${}()|[\]\\])*$/

/** The regular expression for a literal text (the grader requires the whole answer to match). */
export function buildPattern(mode: Exclude<PatternMode, "advanced">, text: string): string {
  const literal = text.replace(META, "\\$&")
  if (mode === "contains") return `.*${literal}.*`
  if (mode === "startsWith") return `${literal}.*`
  if (mode === "endsWith") return `.*${literal}`
  return literal
}

/** The friendly form of a pattern built by `buildPattern`; `null` when it is a hand-written expression. */
export function parsePattern(regex: string): { mode: Exclude<PatternMode, "advanced">; text: string } | null {
  let mode: Exclude<PatternMode, "advanced"> = "exact"
  let body = regex
  if (body.startsWith(".*") && body.endsWith(".*") && body.length >= 4) {
    mode = "contains"
    body = body.slice(2, -2)
  } else if (body.endsWith(".*")) {
    mode = "startsWith"
    body = body.slice(0, -2)
  } else if (body.startsWith(".*")) {
    mode = "endsWith"
    body = body.slice(2)
  }
  if (body === "" || !LITERAL.test(body)) return null
  return { mode, text: body.replace(/\\(.)/g, "$1") }
}
