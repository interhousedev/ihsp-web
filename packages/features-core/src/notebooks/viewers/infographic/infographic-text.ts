import type { InfographicBlock, InfographicContent } from "@ihsp/api"

function itemLines(block: InfographicBlock): string[] {
  return block.items.map((item, index) => {
    const text = [item.head, item.body].filter((part) => part.trim() !== "").join(": ")
    return block.type === "steps" ? `${index + 1}. ${text}` : `- ${text}`
  })
}

function columnLines(block: InfographicBlock): string[] {
  return (block.columns ?? []).flatMap((column) => [column.title, ...column.points.map((point) => `- ${point}`)])
}

/** The infographic as plain text (title, blocks, footer), for Copy text where an image cannot be saved. */
export function infographicToText(content: InfographicContent): string {
  const lines = [content.title]
  if (content.subtitle) lines.push(content.subtitle)
  for (const block of content.blocks) {
    lines.push("")
    if (block.title) lines.push(block.title)
    lines.push(...itemLines(block), ...columnLines(block))
  }
  if (content.footer) lines.push("", content.footer)
  return lines.join("\n")
}
