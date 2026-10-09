import type { Slide, SlidesContent } from "@ihsp/api"
import { slideName } from "./slide-deck-state"

type OutlineLabels = {
  /** Heading of the speaker notes under a slide, for example "Speaker notes". */
  notes: string
}

function slideLines(slide: Slide, notesLabel: string): string[] {
  const lines: string[] = []
  const indent = "   "
  for (const bullet of slide.bullets ?? []) lines.push(`${indent}- ${bullet}`)
  if (slide.body) lines.push(`${indent}${slide.body}`)
  if (slide.quote) {
    lines.push(`${indent}> ${slide.quote.text}`)
    if (slide.quote.attribution) lines.push(`${indent}> -- ${slide.quote.attribution}`)
  }
  for (const column of [slide.left, slide.right]) {
    if (!column) continue
    lines.push(`${indent}${column.heading}`)
    for (const bullet of column.bullets) lines.push(`${indent}  - ${bullet}`)
  }
  if (slide.table) {
    lines.push(`${indent}${slide.table.columns.join(" | ")}`)
    for (const row of slide.table.rows) lines.push(`${indent}${row.join(" | ")}`)
  }
  if (slide.notes.trim()) lines.push(`${indent}${notesLabel}: ${slide.notes.trim()}`)
  return lines
}

/** The deck as plain text (numbered slide titles with their bullets and notes), for Copy outline. */
export function slidesToOutline(
  content: Pick<SlidesContent, "title" | "subtitle">,
  slides: readonly Slide[],
  labels: OutlineLabels,
): string {
  const lines = [content.title]
  if (content.subtitle) lines.push(content.subtitle)
  lines.push("")
  slides.forEach((slide, index) => {
    lines.push(`${index + 1}. ${slideName(slide)}`.trimEnd())
    lines.push(...slideLines(slide, labels.notes))
  })
  return lines.join("\n")
}
