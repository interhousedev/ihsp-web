import { CARD_TEXT_MAX } from "./limits"

export type ImportSeparator = "tab" | "comma" | "semicolon"

export type ImportedCard = { front: string; back: string }

export type ParsedImport = {
  cards: ImportedCard[]
  /** Lines with no separator, an empty side or a side that is too long. */
  skipped: number
}

const SEPARATORS: Record<ImportSeparator, string> = { tab: "\t", comma: ",", semicolon: ";" }

function unquote(field: string): string {
  const text = field.trim()
  return text.length >= 2 && text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1).replaceAll('""', '"') : text
}

/** Index of the first separator that is not inside double quotes, or -1. */
function separatorIndex(line: string, sep: string): number {
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') quoted = !quoted
    else if (!quoted && char === sep) return index
  }
  return -1
}

/**
 * Cards from pasted text or a file: one card per line, the term and the definition split at the first separator
 * (tab by default). Blank lines are ignored; unusable lines are counted in `skipped`.
 */
export function parseImport(text: string, separator: ImportSeparator = "tab"): ParsedImport {
  const sep = SEPARATORS[separator]
  const cards: ImportedCard[] = []
  let skipped = 0
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    if (line.trim() === "") continue
    const at = separatorIndex(line, sep)
    const front = at < 0 ? "" : unquote(line.slice(0, at))
    const back = at < 0 ? "" : unquote(line.slice(at + 1))
    if (!front || !back || front.length > CARD_TEXT_MAX || back.length > CARD_TEXT_MAX) skipped += 1
    else cards.push({ front, back })
  }
  return { cards, skipped }
}

/** Pasted text that is a list of cards: at least one line with a tab in it. */
export function looksLikeImport(text: string): boolean {
  return text.split(/\r?\n/).some((line) => line.includes("\t") && !line.startsWith("\t") && !line.endsWith("\t"))
}

/** A guess for a file: tabs win, then semicolons, then commas. */
export function detectSeparator(text: string): ImportSeparator {
  if (text.includes("\t")) return "tab"
  if (text.includes(";")) return "semicolon"
  return text.includes(",") ? "comma" : "tab"
}
