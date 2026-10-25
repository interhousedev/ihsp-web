"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { InTextGroup } from "./in-text-group"
import type { TextSearch } from "./use-text-search"

type SourceSearchResultsProps = {
  /** The search field has a query: the sources are filtered and the text is searched. */
  active: boolean
  query: string
  /** The sources whose titles match (shown by the list above). */
  titleMatches: readonly SourceItem[]
  text: TextSearch
}

/**
 * What the Sources panel adds below the filtered list while the search field is open: the "In the text" group, the
 * "Nothing found" line and a screen-reader-only count (a live region that stays mounted while the field is open).
 */
export function SourceSearchResults({ active, query, titleMatches, text }: SourceSearchResultsProps) {
  const t = useT("notebooks")
  const found = new Set([...titleMatches.map((source) => source.id), ...text.groups.map((group) => group.source_id)])
  const nothing = active && titleMatches.length === 0 && !text.pending && text.groups.length === 0
  return (
    <>
      <p role="status" className="sr-only">
        {active && !text.pending ? t("sources.searchCount", { count: found.size }) : ""}
      </p>
      {active ? <InTextGroup groups={text.groups} pending={text.pending} query={query} /> : null}
      {nothing ? (
        <p className="text-muted-foreground px-2 py-6 text-center text-sm">{t("sources.searchEmpty", { query })}</p>
      ) : null}
    </>
  )
}
