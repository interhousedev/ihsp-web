"use client"

import { parseLinkedText } from "../utils/mcp-wizard"

/** A message with `[label](key)` links; only the addresses in `MCP_LINKS` become links. */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {parseLinkedText(text).map((segment, index) =>
        segment.type === "text" ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium underline underline-offset-4"
          >
            {segment.label}
          </a>
        ),
      )}
    </>
  )
}
