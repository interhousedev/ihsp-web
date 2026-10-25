// Searching titles and passages in Uzbek, which is written in Latin and in Cyrillic, with several apostrophes.
// Both the query and the text are folded to the same plain form before they are compared.

/** Cyrillic letters (Uzbek and Russian) as the Uzbek Latin alphabet writes them. */
const CYRILLIC_TO_LATIN: Readonly<Record<string, string>> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "'",
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o'",
  қ: "q",
  ғ: "g'",
  ҳ: "h",
}

/** ' ʻ ʼ ‘ ’ ` ´ ʹ ′ : every way the Uzbek tutuq and oʻ / gʻ marks get typed. */
const APOSTROPHES = /['ʻʼ‘’`´ʹ′]/g
const COMBINING_MARKS = /\p{M}/gu
/** Words shorter than this are not marked in a text (one letter would light up half of it). */
const MIN_MARKED_LENGTH = 2

function foldChar(char: string): string {
  let latin = ""
  for (const letter of char.toLowerCase()) latin += CYRILLIC_TO_LATIN[letter] ?? letter
  return latin.replace(APOSTROPHES, "'").normalize("NFD").replace(COMBINING_MARKS, "")
}

/** The folded text and, for each folded letter, where the original letter that produced it starts and ends. */
type Folded = { text: string; source: string; starts: number[]; ends: number[] }

function fold(original: string): Folded {
  // Compose first, so a "й" written as "и" + a combining breve is one letter before it is folded.
  const source = original.normalize("NFC")
  const starts: number[] = []
  const ends: number[] = []
  let text = ""
  let index = 0
  for (const char of source) {
    const part = foldChar(char)
    for (let at = 0; at < part.length; at += 1) {
      starts.push(index)
      ends.push(index + char.length)
    }
    text += part
    index += char.length
  }
  return { text, source, starts, ends }
}

/**
 * The plain form of a text for comparing: lower case, Cyrillic folded to the Uzbek Latin alphabet (ў -> oʻ, қ -> q,
 * ғ -> gʻ, ҳ -> h, ш -> sh ...), every apostrophe form turned into `'`, diacritics dropped.
 */
export function normalizeSearch(text: string): string {
  return fold(text).text
}

/** The words of a query in their plain form. */
function wordsOf(query: string): string[] {
  return normalizeSearch(query).split(/\s+/).filter(Boolean)
}

/** True when every word of the query is found in the title, whatever the script, case or apostrophe. */
export function matches(title: string, query: string): boolean {
  const words = wordsOf(query)
  if (words.length === 0) return true
  const plain = normalizeSearch(title)
  return words.every((word) => plain.includes(word))
}

export type TextPart = { text: string; match: boolean }

/** [start, end) pairs of the original text where a word of the query is found, sorted and merged. */
function matchedRanges(folded: Folded, words: readonly string[]): [number, number][] {
  const ranges: [number, number][] = []
  for (const word of words) {
    if (word.length < MIN_MARKED_LENGTH) continue
    for (let at = folded.text.indexOf(word); at !== -1; at = folded.text.indexOf(word, at + 1)) {
      const start = folded.starts[at]
      const end = folded.ends[at + word.length - 1]
      if (start !== undefined && end !== undefined) ranges.push([start, end])
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }
  return merged
}

/**
 * Splits a text into plain and matching parts for `<mark>`: the words of the query are located with the same folding
 * as `matches`, so a Cyrillic query marks its Latin spelling and the other way round.
 */
export function highlightParts(text: string, query: string): TextPart[] {
  const folded = fold(text)
  const ranges = matchedRanges(folded, wordsOf(query))
  if (ranges.length === 0) return [{ text: folded.source, match: false }]
  const parts: TextPart[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push({ text: folded.source.slice(cursor, start), match: false })
    parts.push({ text: folded.source.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < folded.source.length) parts.push({ text: folded.source.slice(cursor), match: false })
  return parts
}
