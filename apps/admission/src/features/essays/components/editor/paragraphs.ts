import type { DeepRead } from "../../flow/steps-api"

export type Span = { n: number; start: number; end: number }
export type Moment = { start: number; end: number; kind: DeepRead["moments"][number]["kind"]; paragraph: number }

/** Paragraphs as the server counts them: blocks separated by a blank line (trimmed, empty ones dropped). */
export function splitParagraphs(body: string): Span[] {
  const spans: Span[] = []
  const push = (from: number, to: number) => {
    const chunk = body.slice(from, to)
    const lead = chunk.length - chunk.trimStart().length
    const text = chunk.trim()
    if (text) spans.push({ n: spans.length + 1, start: from + lead, end: from + lead + text.length })
  }
  let last = 0
  for (const m of body.matchAll(/\n\s*\n/g)) {
    push(last, m.index)
    last = m.index + m[0].length
  }
  push(last, body.length)
  return spans
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Where a quoted moment sits in the text: whitespace and case tolerant, its own paragraph first. */
export function findQuote(body: string, quote: string, paragraph: Span | undefined): [number, number] | null {
  const words = quote.trim().split(/\s+/).map(escape)
  if (words.length === 0 || !words[0]) return null
  const re = new RegExp(words.join("\\s+"), "i")
  if (paragraph) {
    const hit = re.exec(body.slice(paragraph.start, paragraph.end))
    if (hit) return [paragraph.start + hit.index, paragraph.start + hit.index + hit[0].length]
  }
  const hit = re.exec(body)
  return hit ? [hit.index, hit.index + hit[0].length] : null
}

/** The moments of a reading that can be found in the text, sorted and without overlaps. */
export function locateMoments(body: string, read: DeepRead, spans: Span[]): Moment[] {
  const found: Moment[] = []
  for (const m of read.moments) {
    const at = findQuote(body, m.quote, spans[m.paragraph - 1])
    if (at) found.push({ start: at[0], end: at[1], kind: m.kind, paragraph: m.paragraph })
  }
  found.sort((a, b) => a.start - b.start)
  const out: Moment[] = []
  for (const m of found) if (!out.length || m.start >= out[out.length - 1]!.end) out.push(m)
  return out
}
