"use client"

import { getPassageQuery, isApiError, type Citation } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { HoverCard, HoverCardContent, HoverCardTrigger, cn } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useWorkspace } from "../workspace-context"
import { CitationPopover } from "./citation-popover"
import { useCitationNavigation } from "./use-citation-navigation"

type CitationChipProps = {
  citation: Citation
  className?: string
}

/**
 * A small numbered pill for one citation (`aria-label="Source 1: <title>"`). Hover or focus shows the quote, a click
 * opens the source at the passage. When the passage no longer exists (the source was re-synced) the chip is disabled.
 */
export function CitationChip({ citation, className }: CitationChipProps) {
  const t = useT("notebooks")
  const { notebookId } = useWorkspace()
  const queryClient = useQueryClient()
  const navigation = useCitationNavigation()
  const [removed, setRemoved] = useState(false)

  async function open() {
    try {
      await queryClient.fetchQuery(getPassageQuery(notebookId, citation.passage_id, { context: 0 }))
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        setRemoved(true)
        return
      }
    }
    navigation.open(citation)
  }

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={150}
        closeDelay={100}
        render={
          <button
            type="button"
            aria-label={`${t("citation.label", { n: citation.n })}: ${citation.source_title}`}
            aria-disabled={removed || undefined}
            data-citation={citation.n}
            onClick={() => {
              if (!removed) void open()
            }}
            className={cn(
              "bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-ring relative mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 align-baseline text-[11px] leading-none font-medium tabular-nums outline-hidden focus-visible:ring-2",
              // A larger invisible hit area keeps the chip small but easy to tap.
              "after:absolute after:-inset-2",
              removed && "text-muted-foreground bg-muted line-through",
              className,
            )}
          />
        }
      >
        {citation.n}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <CitationPopover citation={citation} removed={removed} />
      </HoverCardContent>
    </HoverCard>
  )
}
