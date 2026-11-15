"use client"

import { Markdown } from "@ihsp/ui"

/** The Markdown text of a document. Raw HTML in the text is shown as text, never rendered. */
export function LegalDocumentView({ markdown, className }: { markdown: string; className?: string }) {
  return <Markdown className={className}>{markdown}</Markdown>
}
