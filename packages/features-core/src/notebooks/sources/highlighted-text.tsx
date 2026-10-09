"use client"

import { highlightParts } from "../lib/search-text"

/** A text with the words of the query in `<mark>`, found whatever the script, case or apostrophe. */
export function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="bg-primary/20 text-foreground rounded-sm">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  )
}
