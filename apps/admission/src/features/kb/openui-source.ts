import { isRenderable, kbLibrary, safeLinkUrl, splitOpenUi } from "@ihsp/features-core/openui"

/** The blocks the knowledge base editor can insert; each is one ```openui fence of the chat catalogue. */
export type BlockKind = "button" | "linkCard" | "callout" | "steps" | "card"
export type FieldKey = "title" | "text" | "label" | "url" | "tone" | "steps"
export type BlockValues = Partial<Record<FieldKey, string>>

/** Limits of the backend (`admission/kb_body_invalid`): at most 3 blocks of at most 6000 characters, strings of 400. */
export const MAX_BLOCKS = 3
export const MAX_BLOCK_CHARS = 6000
export const MAX_STRING = 400
export const MAX_STEPS = 8

export const BLOCK_FIELDS: Record<BlockKind, FieldKey[]> = {
  button: ["label", "url"],
  linkCard: ["title", "text", "label", "url"],
  callout: ["tone", "title", "text"],
  steps: ["title", "steps"],
  card: ["title", "text"],
}
export const BLOCK_KINDS = Object.keys(BLOCK_FIELDS) as BlockKind[]

/** Language neutral markers of the two callout tones (the card subtitle). */
const TONE_MARK: Record<string, string> = { info: "ℹ", warning: "⚠" }

const quote = (value: string | undefined) => JSON.stringify((value ?? "").replace(/\s+/g, " ").trim())
const link = (v: BlockValues) => `LinkList([{title: ${quote(v.label)}, url: ${quote(v.url)}}])`
const stepList = (v: BlockValues) =>
  (v.steps ?? "")
    .split("\n")
    .map((step) => step.trim())
    .filter(Boolean)

/** The OpenUI source of a block. */
export function buildSource(kind: BlockKind, v: BlockValues): string {
  switch (kind) {
    case "button":
      return `root = Stack([${link(v)}])`
    case "linkCard":
      return `root = Card(${quote(v.title)}, [TextBlock(${quote(v.text)}, "muted"), ${link(v)}])`
    case "callout":
      return `root = Card(${quote(v.title)}, [TextBlock(${quote(v.text)})], ${quote(TONE_MARK[v.tone ?? "info"] ?? TONE_MARK.info)})`
    case "steps":
      return `root = Flow([${stepList(v).map(quote).join(", ")}], ${quote(v.title)})`
    case "card":
      return `root = Card(${quote(v.title)}, [TextBlock(${quote(v.text)})])`
  }
}

/** Every string literal of a source, in order. */
function stringsOf(source: string): string[] {
  return [...source.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) => {
    try {
      return JSON.parse(`"${match[1]}"`) as string
    } catch {
      return match[1] ?? ""
    }
  })
}

/** The kind and field values of a source this editor wrote; null for a block written by hand or by the assistant. */
export function parseSource(source: string): { kind: BlockKind; values: BlockValues } | null {
  const s = stringsOf(source)
  if (/^\s*root\s*=\s*Flow\(/.test(source)) {
    return { kind: "steps", values: { title: s[s.length - 1] ?? "", steps: s.slice(0, -1).join("\n") } }
  }
  if (/^\s*root\s*=\s*Stack\(\[LinkList\(/.test(source) && s.length === 2) {
    return { kind: "button", values: { label: s[0], url: s[1] } }
  }
  if (/^\s*root\s*=\s*Card\(/.test(source) && s.length === 5 && source.includes("LinkList(")) {
    return { kind: "linkCard", values: { title: s[0], text: s[1], label: s[3], url: s[4] } }
  }
  if (/^\s*root\s*=\s*Card\(/.test(source) && s.length === 3) {
    const tone = Object.entries(TONE_MARK).find(([, mark]) => mark === s[2])?.[0]
    if (tone) return { kind: "callout", values: { tone, title: s[0], text: s[1] } }
  }
  if (/^\s*root\s*=\s*Card\(/.test(source) && s.length === 2)
    return { kind: "card", values: { title: s[0], text: s[1] } }
  return null
}

export type FieldError = FieldKey | "source"

/** The field that is wrong, or null when the values make a valid block. Required: label+url, title or text. */
export function validateBlock(kind: BlockKind, v: BlockValues): FieldError | null {
  const fields = BLOCK_FIELDS[kind]
  for (const key of fields) {
    const value = (v[key] ?? "").trim()
    if (key === "steps") {
      const steps = stepList(v)
      if (steps.length === 0 || steps.length > MAX_STEPS || steps.some((step) => step.length > MAX_STRING)) return key
    } else if (key === "tone") continue
    else if (key === "url") {
      if (safeLinkUrl(value, "kb") === null) return key
    } else if (value.length > MAX_STRING) return key
    else if (value === "" && (key === "label" || key === "text" || (key === "title" && kind !== "steps"))) return key
  }
  const source = buildSource(kind, v)
  return source.length <= MAX_BLOCK_CHARS && isRenderable(source, kbLibrary, "kb") ? null : "source"
}

/** How many ```openui blocks a Markdown body has, and whether one is over the size limit. */
export function bodyBlocks(body: string): { count: number; tooLong: boolean } {
  const blocks = splitOpenUi(body).filter((segment) => segment.kind === "block")
  return {
    count: blocks.length,
    tooLong: blocks.some((segment) => segment.kind === "block" && segment.code.length > MAX_BLOCK_CHARS),
  }
}

/** The Markdown fence of a source. */
export const fence = (source: string) => `\`\`\`openui\n${source}\n\`\`\``

/** Appends a block to a Markdown body. */
export const appendBlock = (body: string, source: string) =>
  `${body.trimEnd()}${body.trim() === "" ? "" : "\n\n"}${fence(source)}\n`
