"use client"

import type { WebResult } from "@ihsp/api"
import type { RenderText } from "@ihsp/ui"
import { Fragment, useCallback, type ReactNode } from "react"
import { splitCitations } from "../notebooks/lib/citations"
import { WebCitationChip } from "../notebooks/chat/web-citation-chip"

/**
 * The `renderText` for the assistant's `Markdown`: `⟦w1⟧` and `⟦w1,3⟧` become one web chip (nothing when the page is
 * unknown). Source markers `⟦1⟧` cannot occur in the assistant (it has no notebook), so they are dropped.
 */
export function useWebRenderText(web: readonly WebResult[]): RenderText {
  return useCallback(
    (chunk: string): ReactNode =>
      splitCitations(chunk).map((part, index) => {
        if (part.type === "text") return <Fragment key={index}>{part.text}</Fragment>
        if (part.type === "web") {
          return (
            <span key={index} className="whitespace-nowrap">
              <WebCitationChip numbers={part.numbers} web={web} />
            </span>
          )
        }
        return null
      }),
    [web],
  )
}
