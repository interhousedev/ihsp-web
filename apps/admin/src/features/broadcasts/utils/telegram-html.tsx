import type { ReactNode } from "react"

const ALLOWED = new Set(["b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "code", "pre", "a", "blockquote"])
const TAG_PATTERN = /<(\/?)([a-z][a-z0-9-]*)((?:\s+[a-z-]+="[^"]*")*)\s*>/gi
const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'" }

type Token =
  | { kind: "text"; text: string }
  | { kind: "open"; tag: string; attrs: string }
  | { kind: "close"; tag: string }

function decode(text: string): string {
  return text.replace(/&(lt|gt|amp|quot|#39);/g, (entity) => ENTITIES[entity] ?? entity)
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of source.matchAll(TAG_PATTERN)) {
    const [whole, slash = "", rawTag = "", attrs = ""] = match
    const tag = rawTag.toLowerCase()
    if (!ALLOWED.has(tag)) continue
    const at = match.index ?? 0
    if (at > last) tokens.push({ kind: "text", text: source.slice(last, at) })
    tokens.push(slash ? { kind: "close", tag } : { kind: "open", tag, attrs })
    last = at + whole.length
  }
  if (last < source.length) tokens.push({ kind: "text", text: source.slice(last) })
  return tokens
}

/** Only web and Telegram links are kept; `javascript:` and similar are dropped. */
export function safeHref(attrs: string): string | null {
  const match = /href="([^"]*)"/i.exec(attrs)
  const href = match?.[1] ? decode(match[1]).trim() : ""
  return /^(https?:\/\/|tg:\/\/)/i.test(href) ? href : null
}

type Pending = { tag: string; attrs: string; children: ReactNode[] }

function element(node: Pending, key: number): ReactNode {
  const children = node.children
  switch (node.tag) {
    case "b":
    case "strong":
      return <strong key={key}>{children}</strong>
    case "i":
    case "em":
      return <em key={key}>{children}</em>
    case "u":
    case "ins":
      return <u key={key}>{children}</u>
    case "s":
    case "strike":
    case "del":
      return <s key={key}>{children}</s>
    case "code":
      return (
        <code key={key} className="bg-muted rounded px-1 font-mono text-[0.85em]">
          {children}
        </code>
      )
    case "pre":
      return (
        <pre key={key} className="bg-muted overflow-x-auto rounded p-2 font-mono text-xs">
          {children}
        </pre>
      )
    case "blockquote":
      return (
        <blockquote key={key} className="border-s-2 ps-3">
          {children}
        </blockquote>
      )
    case "a": {
      const href = safeHref(node.attrs)
      return href ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-primary underline underline-offset-2"
        >
          {children}
        </a>
      ) : (
        <span key={key}>{children}</span>
      )
    }
    default:
      return <span key={key}>{children}</span>
  }
}

/**
 * A safe preview of Telegram HTML (b, i, u, s, code, pre, a, blockquote). Everything else is shown as text, so the
 * preview can never run script or load an image. Unclosed tags are closed at the end.
 */
export function renderTelegramHtml(source: string): ReactNode[] {
  const root: Pending = { tag: "root", attrs: "", children: [] }
  const stack: Pending[] = [root]
  let key = 0
  const top = () => stack[stack.length - 1] ?? root

  const close = () => {
    const node = stack.pop()
    if (node) top().children.push(element(node, key++))
  }

  for (const token of tokenize(source)) {
    if (token.kind === "text") top().children.push(decode(token.text))
    else if (token.kind === "open") stack.push({ tag: token.tag, attrs: token.attrs, children: [] })
    else if (stack.some((node) => node.tag === token.tag)) {
      while (top().tag !== token.tag) close()
      close()
    }
  }
  while (stack.length > 1) close()
  return root.children
}
