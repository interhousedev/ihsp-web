// Citations in text: the server turns `[[S1:P4]]` model markers into numbered `⟦1⟧` or `⟦1,2⟧` markers
// (docs/reference/notebooklm.md § 3.3.5); chat answers and reports are rendered from those. Web search results are
// cited as `⟦w1⟧` or `⟦w1,3⟧` (backend/app/shared/web_citations.py): `⟦w`, numbers separated by commas, `⟧`.

import type { WebResult } from "@ihsp/api"

export type CitedPart =
  | { type: "text"; text: string }
  | { type: "marker"; numbers: number[]; raw: string }
  | { type: "web"; numbers: number[]; raw: string }

// Group 1 is `w` for a web marker, group 2 the comma separated numbers. `⟦w⟧`, `⟦x1⟧` and `⟦w1,⟧` do not match.
const MARKER = /⟦\s*(w?)\s*(\d+(?:\s*,\s*\d+)*)\s*⟧/g

function parseNumbers(list: string): number[] {
  return list.split(",").map((value) => Number.parseInt(value.trim(), 10))
}

/**
 * Splits text on `⟦n⟧` and `⟦wn⟧` markers. Adjacent markers give adjacent marker parts; empty text parts are omitted.
 * A source marker has `type: "marker"`, a web marker `type: "web"`.
 */
export function splitCitations(text: string): CitedPart[] {
  const parts: CitedPart[] = []
  let last = 0
  for (const match of text.matchAll(MARKER)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ type: "text", text: text.slice(last, index) })
    const type = match[1] ? "web" : "marker"
    parts.push({ type, numbers: parseNumbers(match[2] ?? ""), raw: match[0] })
    last = index + match[0].length
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) })
  return parts
}

/** Copy to the clipboard: `⟦1,2⟧` becomes `[1][2]` and `⟦w1,3⟧` becomes `[w1][w3]`. */
export function markersToBrackets(text: string): string {
  return text.replace(MARKER, (_match, web: string, numbers: string) =>
    parseNumbers(numbers)
      .map((n) => `[${web}${n}]`)
      .join(""),
  )
}

/** The text without any marker (source or web) and without the space that preceded it (`sugar ⟦1⟧.` becomes `sugar.`). */
export function stripCitations(text: string): string {
  return text.replace(new RegExp(`\\s*${MARKER.source}`, "g"), "")
}

function numbersOf(text: string, type: "marker" | "web"): number[] {
  const seen: number[] = []
  for (const part of splitCitations(text)) {
    if (part.type !== type) continue
    for (const n of part.numbers) if (!seen.includes(n)) seen.push(n)
  }
  return seen
}

/** Every source citation number (`⟦1⟧`) used in the text, in order of first appearance. Web markers are not counted. */
export function citedNumbers(text: string): number[] {
  return numbersOf(text, "marker")
}

/** Every web result number (`⟦w1⟧`) used in the text, in order of first appearance. */
export function citedWebNumbers(text: string): number[] {
  return numbersOf(text, "web")
}

/**
 * The text for the clipboard: markers as brackets, and when the text cites web pages a `heading` line followed by one
 * `[w1] https://…` line per cited page that has a result (in order of first appearance).
 */
export function copyTextWithSources(text: string, web: readonly WebResult[], heading: string): string {
  const body = markersToBrackets(text)
  const lines = citedWebNumbers(text).flatMap((n) => {
    const result = web.find((item) => item.n === n)
    return result ? [`[w${n}] ${result.url}`] : []
  })
  return lines.length > 0 ? `${body}\n\n${heading}\n${lines.join("\n")}` : body
}
