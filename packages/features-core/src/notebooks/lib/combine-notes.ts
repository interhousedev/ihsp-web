import { stripCitations } from "./citations"

export type NoteToCombine = { title: string; body: string | null }

/**
 * One Markdown document from several notes: each note is a `## title` section followed by its text with the citation
 * markers removed (a combined note has no sources of its own), sections separated by a blank line.
 */
export function combineNotesMarkdown(notes: readonly NoteToCombine[]): string {
  return notes
    .map(({ title, body }) => {
      const text = stripCitations(body ?? "").trim()
      return text === "" ? `## ${title}` : `## ${title}\n\n${text}`
    })
    .join("\n\n")
}
