import catalog from "./catalog.json"

export type OpenUiSegment =
  | { kind: "markdown"; text: string }
  | { kind: "block"; code: string }
  /** An `openui` fence that is not closed yet: the model is still writing it. */
  | { kind: "pending" }

const OPEN = new RegExp(`^[ \\t]{0,3}\`\`\`${catalog.fence}[ \\t]*$`)
const CLOSE = /^[ \t]{0,3}```[ \t]*$/

/**
 * Splits a message into Markdown text and ```openui blocks. Only the fence named in the catalog is a block; any other
 * fence stays in the Markdown. An unclosed trailing block is `pending`.
 */
export function splitOpenUi(text: string): OpenUiSegment[] {
  const lines = text.split("\n")
  const out: OpenUiSegment[] = []
  let md = ""
  let code: string[] | null = null

  const flush = () => {
    if (md !== "") out.push({ kind: "markdown", text: md })
    md = ""
  }

  lines.forEach((line, i) => {
    const last = i === lines.length - 1
    if (code === null) {
      if (OPEN.test(line)) {
        flush()
        code = []
      } else {
        md += last ? line : `${line}\n`
      }
      return
    }
    if (CLOSE.test(line)) {
      out.push({ kind: "block", code: code.join("\n") })
      code = null
      return
    }
    code.push(line)
  })

  if (code !== null) out.push({ kind: "pending" })
  else flush()
  return out
}
