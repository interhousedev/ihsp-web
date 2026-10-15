"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"

/**
 * The web query the server suggests when the notebook's sources are too thin for the output (`suggest_web_search`).
 * Nothing is searched by the server; the student starts the search from the Sources pane.
 */
// TODO(contract): drop this cast once the generated ArtifactItem type carries `suggest_web_search`.
export function suggestedQuery(item: ArtifactItem): string | null {
  return (item as ArtifactItem & { suggest_web_search?: { query: string } | null }).suggest_web_search?.query || null
}

type WebSearchHintProps = {
  query: string
  /** Opens the Sources pane with the query in its web search box (not sent). */
  onSearch: (query: string) => void
}

/** "Not enough material": offers the web search for more sources. Shows nothing else and starts nothing. */
export function WebSearchHint({ query, onSearch }: WebSearchHintProps) {
  const t = useT("notebooks")
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p>{t("studio.webHint.message")}</p>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onSearch(query)}>
        {t("studio.webHint.action")}
      </Button>
    </div>
  )
}
