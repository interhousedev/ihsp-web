import catalog from "./catalog.json"

export const LIMITS = catalog.limits

/** Truncates a string to the catalog limit (defence in depth; the backend validates too). */
export function str(value: unknown): string {
  const text = typeof value === "string" ? value : typeof value === "number" ? String(value) : ""
  return text.length > LIMITS.max_string_chars ? text.slice(0, LIMITS.max_string_chars) : text
}

export function clamp<T>(list: readonly T[] | undefined, max: number): T[] {
  return Array.isArray(list) ? list.slice(0, Math.min(max, LIMITS.max_list_items)) : []
}

/** The URL as a string only when it is a valid https link; anything else (javascript:, data:, relative) is null. */
export function safeHttpsUrl(url: unknown): string | null {
  if (typeof url !== "string") return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" ? parsed.href : null
  } catch {
    return null
  }
}

/** All strings in an OpenUI block source, for the readable fallback (no raw source dump). */
export function stringsInBlock(code: string): string[] {
  const found: string[] = []
  // A plain scan, not a regex: a string runs from an opening quote to the next unescaped quote on the same line.
  // A failed scan resumes at its stop point, so each character is read once and nothing backtracks.
  let open = code.indexOf('"')
  while (open !== -1) {
    const scan = closingQuote(code, open + 1)
    if (scan.close === -1) {
      open = code.indexOf('"', scan.stop)
      continue
    }
    const end = scan.close
    let value = code.slice(open + 1, end)
    try {
      value = JSON.parse(`"${value}"`) as string
    } catch {
      // keep the raw text of the string
    }
    if (value.trim() !== "" && !/^https?:\/\//i.test(value)) found.push(str(value))
    open = code.indexOf('"', end + 1)
  }
  return found.slice(0, LIMITS.max_statements)
}

/** The closing quote of a string body starting at `from` (`close` -1 when none), and where the scan stopped. */
function closingQuote(code: string, from: number): { close: number; stop: number } {
  let i = from
  while (i < code.length) {
    const ch = code.charAt(i)
    if (ch === '"') return { close: i, stop: i }
    if (ch === "\n" || ch === "\r") break
    if (ch === "\\") {
      const next = code.charAt(i + 1)
      if (next === "" || next === "\n" || next === "\r" || next === " " || next === " ") break
      i += 2
      continue
    }
    i++
  }
  return { close: -1, stop: i }
}
