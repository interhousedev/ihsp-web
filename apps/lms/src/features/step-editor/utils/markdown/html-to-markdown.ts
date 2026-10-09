import { markersFor } from "./inline-format"
import { linkDestination } from "./link-format"
import type { InlineFormat } from "./markdown-index"

/** Inline formats in the order they nest (outermost first); code is innermost, as it can't hold others. */
const ORDER: readonly InlineFormat[] = ["spoiler", "underline", "strike", "bold", "italic", "code"]

interface Run {
  text: string
  formats: ReadonlySet<InlineFormat>
  href: string | null
  /** Markdown written as is (a formula copied from rendered math). */
  raw?: boolean
}

type Block =
  | { type: "paragraph"; runs: Run[] }
  | { type: "heading"; level: number; runs: Run[] }
  | { type: "code"; text: string; language: string }
  | { type: "quote"; children: Block[] }
  | { type: "list"; ordered: boolean; start: number; items: Block[][] }
  | { type: "rule" }

interface Context {
  formats: ReadonlySet<InlineFormat>
  href: string | null
}

const SKIPPED = new Set([
  "script",
  "style",
  "head",
  "title",
  "meta",
  "link",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",
  "img",
  "picture",
  "video",
  "audio",
  "svg",
  "canvas",
  "button",
  "input",
  "select",
  "textarea",
  "form",
])

const BLOCKS = new Set([
  "p",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "aside",
  "nav",
  "figure",
  "figcaption",
  "address",
  "dl",
  "dt",
  "dd",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "caption",
  "details",
  "summary",
  "center",
])

/**
 * Converts pasted HTML (from web pages, word processors, Telegram or our own preview) to Markdown with the formats
 * the editor knows: bold, italic, underline, strikethrough, code, spoilers, links (`http`, `https` and `mailto` only),
 * headings, lists, quotes, code blocks and formulas copied from rendered math. Everything else becomes plain text with
 * Markdown characters escaped; scripts, styles, images and forms are dropped. Returns `null` when the HTML has no
 * formatting at all, so the browser's plain text paste is used.
 */
export function htmlToMarkdown(html: string): string | null {
  const body = new DOMParser().parseFromString(html, "text/html").body
  const builder = new Builder()
  walk(body, { formats: new Set(), href: null }, builder)
  const blocks = builder.finish()
  if (!blocks.some(isFormatted)) return null
  return writeBlocks(blocks).join("\n").trim()
}

class Builder {
  blocks: Block[] = []
  runs: Run[] = []

  flush(): void {
    if (this.runs.some((run) => run.text.trim() !== "")) this.blocks.push({ type: "paragraph", runs: this.runs })
    this.runs = []
  }

  finish(): Block[] {
    this.flush()
    return this.blocks
  }
}

function isFormatted(block: Block): boolean {
  if (block.type !== "paragraph") return true
  return block.runs.some((run) => run.formats.size > 0 || run.href !== null || run.raw === true)
}

// - - - Reading the DOM - - -

function walk(parent: Node, context: Context, builder: Builder): void {
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      builder.runs.push({ text: (node.textContent ?? "").replace(/\s+/g, " "), ...context })
    } else if (node instanceof Element) {
      element(node, context, builder)
    }
  }
}

function element(node: Element, context: Context, builder: Builder): void {
  const tag = node.tagName.toLowerCase()
  if (SKIPPED.has(tag) || (node.getAttribute("aria-hidden") === "true" && !node.classList.contains("katex"))) return
  if (node.classList.contains("katex")) {
    builder.runs.push({ text: formulaOf(node), formats: new Set(), href: null, raw: true })
    return
  }
  if (tag === "br") {
    builder.runs.push({ text: "\n", ...context })
    return
  }
  const level = /^h([1-6])$/.exec(tag)?.[1]
  if (level) {
    builder.flush()
    builder.blocks.push({ type: "heading", level: Math.min(3, Number(level)), runs: inlineRuns(node, context) })
    return
  }
  if (tag === "pre") {
    builder.flush()
    builder.blocks.push({ type: "code", text: (node.textContent ?? "").replace(/\n$/, ""), language: languageOf(node) })
    return
  }
  if (tag === "hr") {
    builder.flush()
    builder.blocks.push({ type: "rule" })
    return
  }
  if (tag === "blockquote") {
    builder.flush()
    builder.blocks.push({ type: "quote", children: blocksOf(node, context) })
    return
  }
  if (tag === "ul" || tag === "ol") {
    builder.flush()
    const items = Array.from(node.children).filter((child) => child.tagName.toLowerCase() === "li")
    const start = Number(node.getAttribute("start") ?? "1")
    builder.blocks.push({
      type: "list",
      ordered: tag === "ol",
      start: Number.isInteger(start) && start >= 0 ? start : 1,
      items: items.map((item) => blocksOf(item, context)),
    })
    return
  }
  if (BLOCKS.has(tag) || tag === "li") {
    if (node.parentElement?.hasAttribute("data-language") && tag === "div") return // our code block's language label
    builder.flush()
    walk(node, context, builder)
    builder.flush()
    return
  }
  if (tag === "td" || tag === "th") {
    walk(node, context, builder)
    builder.runs.push({ text: " ", ...context })
    return
  }
  walk(node, inlineContext(node, tag, context), builder)
}

function blocksOf(node: Element, context: Context): Block[] {
  const builder = new Builder()
  walk(node, context, builder)
  return builder.finish()
}

/** The text runs of a heading: block children inside it are read as text. */
function inlineRuns(node: Element, context: Context): Run[] {
  const blocks = blocksOf(node, context)
  return blocks.flatMap((block, position) => {
    const runs = block.type === "paragraph" || block.type === "heading" ? block.runs : []
    return position === 0 ? runs : [{ text: " ", formats: new Set<InlineFormat>(), href: null }, ...runs]
  })
}

function inlineContext(node: Element, tag: string, context: Context): Context {
  const formats = new Set(context.formats)
  if (tag === "b" || tag === "strong") formats.add("bold")
  if (tag === "i" || tag === "em") formats.add("italic")
  if (tag === "u" || tag === "ins") formats.add("underline")
  if (tag === "s" || tag === "strike" || tag === "del") formats.add("strike")
  if (tag === "code" || tag === "kbd" || tag === "samp" || tag === "tt") formats.add("code")
  if (tag === "tg-spoiler" || node.classList.contains("tg-spoiler") || node.hasAttribute("data-spoiler")) {
    formats.add("spoiler")
  }
  const style = node.getAttribute("style") ?? ""
  const weight = /font-weight\s*:\s*([\w-]+)/i.exec(style)?.[1]?.toLowerCase()
  if (weight) {
    if (weight === "bold" || weight === "bolder" || Number(weight) >= 600) formats.add("bold")
    else formats.delete("bold")
  }
  const fontStyle = /font-style\s*:\s*([\w-]+)/i.exec(style)?.[1]?.toLowerCase()
  if (fontStyle === "italic" || fontStyle === "oblique") formats.add("italic")
  else if (fontStyle === "normal") formats.delete("italic")
  const decoration = /text-decoration(?:-line)?\s*:\s*([^;]+)/i.exec(style)?.[1]?.toLowerCase() ?? ""
  if (decoration.includes("underline")) formats.add("underline")
  if (decoration.includes("line-through")) formats.add("strike")
  let href = context.href
  if (tag === "a") href = linkTarget(node.getAttribute("href")) ?? href
  return { formats, href }
}

/** Only absolute web and mail addresses are kept: relative links pointed into the site they were copied from. */
function linkTarget(href: string | null): string | null {
  if (!href || !/^(https?:\/\/|mailto:)/i.test(href.trim())) return null
  try {
    return new URL(href.trim()).href
  } catch {
    return null
  }
}

function languageOf(pre: Element): string {
  const holder = pre.querySelector("code") ?? pre
  const fromClass = /(?:^|\s)(?:language|lang)-([\w+#-]+)/.exec(holder.className)?.[1]
  return fromClass ?? pre.parentElement?.getAttribute("data-language") ?? ""
}

/** A formula copied from rendered math (KaTeX keeps the LaTeX in its MathML annotation). */
function formulaOf(node: Element): string {
  const latex = (
    node.querySelector('annotation[encoding="application/x-tex"]')?.textContent ??
    node.querySelector(".katex-mathml")?.textContent ??
    node.textContent ??
    ""
  ).trim()
  const display = node.closest(".katex-display, [data-math='display']") !== null
  return display ? `$$${latex}$$` : `$${latex}$`
}

// - - - Writing Markdown - - -

function writeBlocks(blocks: Block[]): string[] {
  const lines: string[] = []
  blocks.forEach((block, position) => {
    if (position > 0) lines.push("")
    lines.push(...writeBlock(block))
  })
  return lines
}

function writeBlock(block: Block): string[] {
  switch (block.type) {
    case "paragraph":
      return writeInline(block.runs)
        .split("\n")
        .map((line) => escapeLineStart(line.trim()))
    case "heading":
      return [
        `${"#".repeat(block.level)} ${writeInline(block.runs)
          .replace(/\s*\n\s*/g, " ")
          .trim()}`,
      ]
    case "code": {
      const longest = Math.max(0, ...(block.text.match(/^`+/gm) ?? []).map((run) => run.length))
      const fence = "`".repeat(Math.max(3, longest + 1))
      return [`${fence}${block.language}`, ...block.text.split("\n"), fence]
    }
    case "quote":
      return writeBlocks(block.children).map((line) => (line === "" ? ">" : `> ${line}`))
    case "list":
      return block.items.flatMap((item, position) => {
        const marker = block.ordered ? `${block.start + position}. ` : "- "
        const lines = writeBlocks(item)
        if (lines.length === 0) return [marker.trimEnd()]
        return lines.map((line, index) =>
          index === 0 ? marker + line : line === "" ? "" : " ".repeat(marker.length) + line,
        )
      })
    case "rule":
      return ["---"]
  }
}

/** Runs to Markdown, with markers opened and closed so they nest, and spaces kept outside the markers. */
function writeInline(runs: Run[]): string {
  let output = ""
  let open: string[] = []
  let gap = ""
  const closeTo = (keep: number) => {
    while (open.length > keep) output += closer(open.pop() ?? "")
  }
  for (const run of merge(runs)) {
    const core = run.text.trim()
    if (core === "" && !run.raw) {
      // Spaces between two formatted runs keep only the formats they have themselves: `**a** **b**`.
      const wanted = marksOf(run)
      let keep = 0
      while (keep < open.length && keep < wanted.length && open[keep] === wanted[keep]) keep++
      closeTo(keep)
      open = open.slice(0, keep)
      gap = joinGaps(gap, leadingGap(run.text))
      continue
    }
    gap = joinGaps(gap, leadingGap(run.text))
    if (run.raw) {
      closeTo(0)
      output += gap + core
      gap = trailingGap(run.text)
      continue
    }
    const wanted = marksOf(run)
    let keep = 0
    while (keep < open.length && keep < wanted.length && open[keep] === wanted[keep]) keep++
    closeTo(keep)
    output += gap
    for (const mark of wanted.slice(keep)) output += opener(mark)
    open = wanted
    if (run.formats.has("code")) {
      // Code is innermost and can't hold markers, so each code run is a whole code span.
      const [codeOpen, codeClose] = markersFor("code", core)
      output += codeOpen + core + codeClose
    } else {
      output += escapeText(core)
    }
    gap = trailingGap(run.text)
  }
  closeTo(0)
  return output
}

function leadingGap(text: string): string {
  if (!/^\s/.test(text)) return ""
  return /^[^\S\n]*\n/.test(text) ? "\n" : " "
}

function trailingGap(text: string): string {
  if (!/\s$/.test(text)) return ""
  return /\n[^\S\n]*$/.test(text) ? "\n" : " "
}

function joinGaps(a: string, b: string): string {
  return a === "\n" || b === "\n" ? "\n" : a || b
}

/** Adjacent runs with the same formats and link are one run. */
function merge(runs: Run[]): Run[] {
  const merged: Run[] = []
  for (const run of runs) {
    const last = merged.at(-1)
    if (last && !last.raw && !run.raw && last.href === run.href && sameFormats(last.formats, run.formats)) {
      merged[merged.length - 1] = { ...last, text: last.text + run.text }
    } else {
      merged.push(run)
    }
  }
  return merged
}

function sameFormats(a: ReadonlySet<InlineFormat>, b: ReadonlySet<InlineFormat>): boolean {
  return a.size === b.size && [...a].every((format) => b.has(format))
}

/** The markers a run needs, outermost first: the link, then the formats in nesting order (code is written apart). */
function marksOf(run: Run): string[] {
  const marks = run.href ? [`link:${run.href}`] : []
  return [...marks, ...ORDER.filter((format) => format !== "code" && run.formats.has(format))]
}

function opener(mark: string): string {
  return mark.startsWith("link:") ? "[" : markersFor(mark as InlineFormat, "")[0]
}

function closer(mark: string): string {
  if (mark.startsWith("link:")) return `](${linkDestination(mark.slice(5))})`
  return markersFor(mark as InlineFormat, "")[1]
}

/** Escapes characters that would start Markdown syntax inside text. */
function escapeText(text: string): string {
  return text
    .replace(/[\\`*~[\]<|$]/g, (char) => `\\${char}`)
    .replace(/(^|[^\p{L}\p{N}])_|_(?=[^\p{L}\p{N}]|$)/gu, (match) => match.replace("_", "\\_"))
    .replace(/&(?=#?\w+;)/g, "\\&")
}

/** A line starting like a heading, quote, list item or rule would turn into one: its first character is escaped. */
function escapeLineStart(line: string): string {
  if (/^(#{1,6}|[>+-])(\s|$)/.test(line) || line.startsWith(">") || /^([-=_])\1{2,}\s*$/.test(line)) return `\\${line}`
  const ordered = /^(\d{1,9})[.)](\s|$)/.exec(line)
  return ordered?.[1] ? `${ordered[1]}\\${line.slice(ordered[1].length)}` : line
}
