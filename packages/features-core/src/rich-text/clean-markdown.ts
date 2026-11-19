/**
 * Markdown as the editor stores it: the serializer writes an empty paragraph as `&nbsp;` and leaves runs of blank
 * lines. Those lines are dropped (outside code fences), blank runs shrink to one, and the ends are trimmed.
 */
export function cleanMarkdown(markdown: string): string {
  const out: string[] = []
  let fence: string | null = null
  for (const line of markdown.split("\n")) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1]
    if (marker) {
      if (fence === null) fence = marker[0]
      else if (marker[0] === fence) fence = null
    }
    if (fence !== null || marker) {
      out.push(line)
      continue
    }
    const text = line.replace(/&nbsp;|\u00a0/g, " ")
    if (text.trim() === "") {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("")
    } else out.push(line)
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop()
  return out.join("\n")
}
