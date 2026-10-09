"use client"

import type { Citation, WebResult } from "@ihsp/api"
import { Markdown, cn } from "@ihsp/ui"
import { Fragment, useCallback, type ReactNode } from "react"
import { splitCitations } from "../lib/citations"
import { CitationChip } from "./citation-chip"
import { WebCitationChip } from "./web-citation-chip"

type CitedMarkdownProps = {
  /** Markdown with `⟦1⟧` or `⟦1,2⟧` markers (and `⟦w1⟧` web markers), as in a chat answer or a report. */
  text: string
  citations: readonly Citation[]
  /** The web pages of the answer; `⟦w1⟧` markers become web chips. Without them web markers render nothing. */
  web?: readonly WebResult[]
  className?: string
}

const NO_WEB: readonly WebResult[] = []

/**
 * Safe Markdown whose citation markers are rendered as numbered chips (one `CitationChip` per number) and whose web
 * markers `⟦w1,3⟧` are rendered as one `WebCitationChip`. A number without a matching citation or page renders nothing.
 * Used by chat answers, reports and the "Explain" panels.
 */
export function CitedMarkdown({ text, citations, web = NO_WEB, className }: CitedMarkdownProps) {
  const renderText = useCallback(
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
        return (
          <span key={index} className="whitespace-nowrap">
            {part.numbers.map((n) => {
              const citation = citations.find((item) => item.n === n)
              return citation ? <CitationChip key={n} citation={citation} /> : null
            })}
          </span>
        )
      }),
    [citations, web],
  )
  return (
    <Markdown renderText={renderText} className={cn("text-sm leading-relaxed", className)}>
      {text}
    </Markdown>
  )
}
