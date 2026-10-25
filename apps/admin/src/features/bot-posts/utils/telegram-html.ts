import type { JSONContent } from "@tiptap/react"

/**
 * Serializes an editor document to the Telegram HTML subset: b, i, u, s, tg-spoiler, code, pre, a and blockquote.
 * Only the marks and nodes the body editor offers are written; everything else is dropped to its text.
 * Text is escaped, so the output is safe to show with `dangerouslySetInnerHTML`.
 */

/** Outermost to innermost. Fixed order keeps the tags well nested. */
const MARK_ORDER = ["link", "bold", "italic", "underline", "strike", "spoiler", "code"] as const

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

function openTag(mark: JSONContent): { open: string; close: string } | null {
  switch (mark.type) {
    case "link": {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : ""
      if (!/^https?:\/\//i.test(href)) return null
      return { open: `<a href="${escapeHtml(href)}">`, close: "</a>" }
    }
    case "bold":
      return { open: "<b>", close: "</b>" }
    case "italic":
      return { open: "<i>", close: "</i>" }
    case "underline":
      return { open: "<u>", close: "</u>" }
    case "strike":
      return { open: "<s>", close: "</s>" }
    case "spoiler":
      return { open: "<tg-spoiler>", close: "</tg-spoiler>" }
    case "code":
      return { open: "<code>", close: "</code>" }
    default:
      return null
  }
}

function textOf(node: JSONContent): string {
  if (node.type === "text") return node.text ?? ""
  if (node.type === "hardBreak") return "\n"
  return (node.content ?? []).map(textOf).join("")
}

function serializeText(node: JSONContent): string {
  const marks = (node.marks ?? [])
    .filter((mark) => MARK_ORDER.includes(mark.type as (typeof MARK_ORDER)[number]))
    .toSorted((a, b) => MARK_ORDER.indexOf(a.type as never) - MARK_ORDER.indexOf(b.type as never))
  const tags = marks.map(openTag).filter((tag): tag is { open: string; close: string } => tag !== null)
  const body = escapeHtml(node.text ?? "")
  return tags.reduceRight((inner, tag) => `${tag.open}${inner}${tag.close}`, body)
}

function serializeInline(nodes: JSONContent[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return serializeText(node)
      if (node.type === "hardBreak") return "\n"
      return serializeInline(node.content)
    })
    .join("")
}

function serializeBlock(node: JSONContent): string {
  switch (node.type) {
    case "paragraph":
      return serializeInline(node.content)
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(serializeBlock).join("\n")}</blockquote>`
    case "codeBlock":
      return `<pre>${escapeHtml(textOf(node))}</pre>`
    default:
      return serializeInline(node.content)
  }
}

/** The Telegram HTML of an editor document (`editor.getJSON()`). An empty document is an empty string. */
export function toTelegramHtml(doc: JSONContent): string {
  return (doc.content ?? []).map(serializeBlock).join("\n")
}
