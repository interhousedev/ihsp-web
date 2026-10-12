// Uzbek has two scripts. The backend stores a `search_text` of Uzbek items in one Latin form and normalises the query
// the same way (`uz_translit` in `backend/app/shared/text.py`). The
// reader normalises the typed query and the page text the same way for "search in this item", so "ўзбек" finds
// "oʻzbek", "o'zbek" and "O‘ZBEK" on a page. Keep this file in step with the Python function (the tests share its vectors).

/** The letter modifier of `oʻ` and `gʻ` (U+02BB). */
export const OKINA = "\u02bb"
/** The glottal stop of `maʼno` (U+02BC), also what every stray apostrophe becomes. */
export const TUTUQ = "\u02bc"

const CYR_TO_LAT: Readonly<Record<string, string>> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
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
  ъ: TUTUQ,
  ы: "i",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: `o${OKINA}`,
  қ: "q",
  ғ: `g${OKINA}`,
  ҳ: "h",
}

/** Letters after which `е` is read `ye`, as at the start of a word. */
const YE_AFTER = new Set("аеёиоуўэюяыъь")

const APOSTROPHES = "'\u02bb\u02bc\u2018\u2019\u201b`\u00b4\u2032\u02b9"
const APOSTROPHE = new RegExp(`([og]?)([${APOSTROPHES}])`, "g")
const LETTER = /^\p{L}$/u

function latinFor(letter: string, previous: string): string {
  if (letter === "е") {
    const startsWord = previous === "" || !LETTER.test(previous)
    return startsWord || YE_AFTER.has(previous) ? "ye" : "e"
  }
  return CYR_TO_LAT[letter] ?? letter
}

function cyrillicToLatin(text: string): string {
  let out = ""
  let previous = ""
  for (const letter of text) {
    out += latinFor(letter, previous)
    previous = letter
  }
  return out
}

function tidy(text: string): string {
  return text.split(/\s+/u).filter(Boolean).join(" ")
}

function isUzbek(language: string): boolean {
  return language.toLowerCase().split(/[-_]/u, 1)[0] === "uz"
}

/**
 * Brings Uzbek text in either script to one lower-case Latin form (`ўзбек` -> `oʻzbek`, `маъно` -> `maʼno`;
 * `е` is `ye` at the start of a word and after a vowel or a sign). Every apostrophe variant collapses to one
 * character: after `o` or `g` it is U+02BB, anywhere else U+02BC. Idempotent. For other languages (`ru`, `en`) only
 * case and whitespace are normalised: Russian is not transliterated.
 */
export function uzTranslit(text: string, language = "uz"): string {
  if (!isUzbek(language)) return tidy(text.toLowerCase())
  const lowered = text.normalize("NFC").toLowerCase()
  const latin = cyrillicToLatin(lowered).replace(APOSTROPHE, (_match, base: string) => base + (base ? OKINA : TUTUQ))
  return tidy(latin)
}

/** The form in which a text is compared with a query; the same function as `search_normalize` of the backend. */
export function searchNormalize(text: string, language = "uz"): string {
  return uzTranslit(text, language)
}

export type NormalizedText = {
  /** The normalised text (same result as `uzTranslit` for Uzbek, lower case and tidy for other languages). */
  text: string
  /** `starts[i]` is the offset in the original text where the source of normalised character `i` begins. */
  starts: number[]
  /** `ends[i]` is the offset in the original text just after that source. */
  ends: number[]
}

/** `uzTranslit` that remembers where every output character came from, so a hit can be shown in the original text. */
export function normalizeWithMap(source: string, language = "uz"): NormalizedText {
  const uzbek = isUzbek(language)
  const chars: { ch: string; start: number; end: number }[] = []
  let previous = ""
  // A base letter with its combining marks is composed on its own (`у` + breve = `ў`) so offsets stay exact.
  for (const match of source.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    for (const letter of match[0].normalize("NFC")) {
      const lower = letter.toLowerCase()
      const piece = uzbek ? latinFor(lower, previous) : lower
      for (const ch of piece) chars.push({ ch, start, end })
      previous = lower
    }
  }
  if (uzbek) {
    let before = ""
    for (const entry of chars) {
      if (APOSTROPHES.includes(entry.ch)) entry.ch = before === "o" || before === "g" ? OKINA : TUTUQ
      before = entry.ch
    }
  }
  let text = ""
  const starts: number[] = []
  const ends: number[] = []
  let pendingSpace: { start: number; end: number } | null = null
  for (const entry of chars) {
    if (/^\s$/u.test(entry.ch)) {
      if (text !== "") pendingSpace = pendingSpace ?? { start: entry.start, end: entry.end }
      continue
    }
    if (pendingSpace) {
      text += " "
      starts.push(pendingSpace.start)
      ends.push(pendingSpace.end)
      pendingSpace = null
    }
    text += entry.ch
    starts.push(entry.start)
    ends.push(entry.end)
  }
  return { text, starts, ends }
}

export type TextHit = { start: number; end: number }

/**
 * Every non-overlapping occurrence of `query` in `source`, as ranges of the **original** text. Both are normalised
 * with `normalizeWithMap`, so for Uzbek the Cyrillic and Latin spellings meet.
 */
export function findInText(source: string, query: string, language = "uz", limit = 200): TextHit[] {
  const needle = uzTranslit(query, language)
  if (!needle) return []
  const haystack = normalizeWithMap(source, language)
  const hits: TextHit[] = []
  let from = 0
  while (hits.length < limit) {
    const index = haystack.text.indexOf(needle, from)
    if (index < 0) break
    const last = index + needle.length - 1
    hits.push({ start: haystack.starts[index]!, end: haystack.ends[last]! })
    from = index + needle.length
  }
  return hits
}
