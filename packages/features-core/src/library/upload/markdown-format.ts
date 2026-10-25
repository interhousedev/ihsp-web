// Formatting commands of the Markdown editor. Pure functions on (text, selection) so they are easy to test; the editor
// applies the result to its textarea. The renderer (`Markdown` of @ihsp/ui) understands GFM, `$math$`, `$$display math$$`.

export type FormatAction =
  | "bold"
  | "italic"
  | "code"
  | "link"
  | "math"
  | "mathBlock"
  | "heading"
  | "bullet"
  | "numbered"
  | "quote"

export type Placeholders = {
  /** Shown selected when nothing was selected, so typing replaces it (for example "text"). */
  text: string
  formula: string
  url: string
}

export type Edit = { text: string; start: number; end: number }

function wrap(text: string, start: number, end: number, before: string, after: string, fallback: string): Edit {
  const selected = text.slice(start, end) || fallback
  const next = text.slice(0, start) + before + selected + after + text.slice(end)
  return { text: next, start: start + before.length, end: start + before.length + selected.length }
}

function link(text: string, start: number, end: number, placeholders: Placeholders): Edit {
  const label = text.slice(start, end) || placeholders.text
  const insert = `[${label}](${placeholders.url})`
  const urlStart = start + label.length + 3
  return {
    text: text.slice(0, start) + insert + text.slice(end),
    start: urlStart,
    end: urlStart + placeholders.url.length,
  }
}

/** Puts `prefix` (or a counting prefix) in front of every line the selection touches. */
function prefixLines(text: string, start: number, end: number, prefix: (index: number) => string): Edit {
  const from = text.lastIndexOf("\n", start - 1) + 1
  const nl = text.indexOf("\n", end)
  const to = nl === -1 ? text.length : nl
  const lines = text.slice(from, to).split("\n")
  const changed = lines.map((line, index) => prefix(index) + line).join("\n")
  return { text: text.slice(0, from) + changed + text.slice(to), start: from, end: from + changed.length }
}

/** Applies a toolbar command to the selection `[start, end)` and returns the new text and selection. */
export function applyFormat(
  text: string,
  start: number,
  end: number,
  action: FormatAction,
  placeholders: Placeholders,
): Edit {
  switch (action) {
    case "bold":
      return wrap(text, start, end, "**", "**", placeholders.text)
    case "italic":
      return wrap(text, start, end, "_", "_", placeholders.text)
    case "code":
      return wrap(text, start, end, "`", "`", placeholders.text)
    case "math":
      return wrap(text, start, end, "$", "$", placeholders.formula)
    case "mathBlock": {
      const lead = start > 0 && text[start - 1] !== "\n" ? "\n" : ""
      return wrap(text, start, end, `${lead}$$\n`, "\n$$\n", placeholders.formula)
    }
    case "link":
      return link(text, start, end, placeholders)
    case "heading":
      return prefixLines(text, start, end, () => "## ")
    case "bullet":
      return prefixLines(text, start, end, () => "- ")
    case "numbered":
      return prefixLines(text, start, end, (index) => `${index + 1}. `)
    case "quote":
      return prefixLines(text, start, end, () => "> ")
  }
}
