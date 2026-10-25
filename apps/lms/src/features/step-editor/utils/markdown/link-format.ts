import { indexMarkdown, type LinkSpan, type MarkdownIndex } from "./markdown-index"
import type { TextState } from "./text-state"

/** The `[text](url)` link around the selection, if any (autolinks are plain text in the editor). */
export function linkAt(state: TextState, index: MarkdownIndex = indexMarkdown(state.text)): LinkSpan | null {
  return index.links.find((link) => link.inline && encloses(link, state)) ?? null
}

/** A caret strictly inside the span, or a selection within it. */
export function encloses(span: { start: number; end: number }, state: TextState): boolean {
  if (state.start === state.end) return span.start < state.start && state.start < span.end
  return span.start <= state.start && state.end <= span.end
}

/** What the link dialog starts with: the link at the selection, or the selected text. */
export function linkDraftAt(state: TextState): {
  text: string
  url: string
  editing: boolean
} {
  const link = linkAt(state)
  if (link)
    return {
      text: state.text.slice(link.contentStart, link.contentEnd),
      url: link.url,
      editing: true,
    }
  return {
    text: state.text
      .slice(state.start, state.end)
      .replace(/\s*\n\s*/g, " ")
      .trim(),
    url: "",
    editing: false,
  }
}

/**
 * A link address as it may be saved: `https://`, `http://` and `mailto:` addresses, site paths (`/…`) and anchors
 * (`#…`); a bare domain (`ihsu.uz/page`) gets `https://`. Anything else (`javascript:`, `data:`, words) is `null`.
 */
export function normalizeUrl(input: string): string | null {
  const url = input.trim()
  if (url === "") return null
  if (/^(https?:\/\/|mailto:)/i.test(url)) return isValidUrl(url) ? url : null
  if ((url.startsWith("/") && !url.startsWith("//")) || url.startsWith("#")) return url
  if (/^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.\p{L}{2,}(:\d+)?([/?#]\S*)?$/u.test(url)) {
    const withScheme = `https://${url}`
    return isValidUrl(withScheme) ? withScheme : null
  }
  return null
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "mailto:" ? parsed.pathname.length > 0 : parsed.hostname.length > 0
  } catch {
    return false
  }
}

/** The address as a Markdown destination: spaces, parentheses and angle brackets are percent-encoded. */
export function linkDestination(url: string): string {
  return url.replace(/[\s()<>]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`)
}

/** Link text as Markdown: on one line, with unescaped square brackets escaped. */
function label(text: string): string {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replace(/(\\*)([[\]])/g, (match, backslashes: string, bracket: string) =>
      backslashes.length % 2 === 1 ? match : `${backslashes}\\${bracket}`,
    )
}

/**
 * Writes `[text](url)` over the selection, or over the link being edited. Without text the address is the text.
 * The caret ends up after the link. `url` must come from `normalizeUrl`.
 */
export function applyLink(state: TextState, text: string, url: string): TextState {
  const link = linkAt(state)
  const from = link ? link.start : state.start
  const to = link ? link.end : state.end
  const shown = text.trim() === "" ? url.replace(/^mailto:/i, "") : text.trim()
  const written = `[${label(shown)}](${linkDestination(url)})`
  const caret = from + written.length
  return {
    text: state.text.slice(0, from) + written + state.text.slice(to),
    start: caret,
    end: caret,
  }
}

/** Turns the link at the selection back into its text. */
export function removeLink(state: TextState): TextState {
  const link = linkAt(state)
  if (!link) return state
  const inner = state.text.slice(link.contentStart, link.contentEnd)
  const text = state.text.slice(0, link.start) + inner + state.text.slice(link.end)
  return { text, start: link.start, end: link.start + inner.length }
}
