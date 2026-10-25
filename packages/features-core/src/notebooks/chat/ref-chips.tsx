"use client"

import type { Citation, RefsIndex } from "@ihsp/api"
import { cn } from "@ihsp/ui"
import { CitationChip } from "./citation-chip"

/** Turns the `refs` labels (`"S1:P4"`) of an artifact item into numbered citations using the artifact's `refs_index`. */
export function citationsFromRefs(refs: readonly string[], index: RefsIndex): Citation[] {
  const seen = new Set<string>()
  const citations: Citation[] = []
  for (const label of refs) {
    const entry = index[label]
    if (!entry || seen.has(entry.passage_id)) continue
    seen.add(entry.passage_id)
    citations.push({ n: citations.length + 1, ...entry })
  }
  return citations
}

type RefChipsProps = {
  refs: readonly string[]
  refsIndex: RefsIndex
  className?: string
}

/** Citation chips for the `refs` of a flash card, quiz question, table row, mind map node, slide or block. */
export function RefChips({ refs, refsIndex, className }: RefChipsProps) {
  const citations = citationsFromRefs(refs, refsIndex)
  if (citations.length === 0) return null
  return (
    <span className={cn("inline-flex flex-wrap items-center", className)}>
      {citations.map((citation) => (
        <CitationChip key={citation.passage_id} citation={citation} />
      ))}
    </span>
  )
}
