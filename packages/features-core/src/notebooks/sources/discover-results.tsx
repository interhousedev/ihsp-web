"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconArrowLeft } from "@ihsp/ui"
import { DiscoverPicker } from "./discover-picker"
import { DiscoverResultsSkeleton } from "./discover-results-skeleton"
import type { DiscoverFlow } from "./use-discover"

type DiscoverResultsProps = {
  notebookId: string
  flow: DiscoverFlow
}

/**
 * What Discover found, in place of the source list: "← Results for «query»" with the count (a deep search also lists
 * the queries it ran), then the pages to tick and add. The back arrow closes it.
 */
export function DiscoverResults({ notebookId, flow }: DiscoverResultsProps) {
  const t = useT("notebooks")
  const { request, response } = flow
  const deep = (response?.mode ?? request?.mode) === "deep"
  return (
    <section aria-label={t("discover.results", { query: request?.query ?? "" })} className="flex flex-col gap-2">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 md:size-8"
            aria-label={t("discover.back")}
            onClick={flow.close}
          >
            <IconArrowLeft aria-hidden />
          </Button>
          <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
            {t("discover.results", { query: request?.query ?? "" })}
          </h3>
          {response ? (
            <span role="status" className="text-muted-foreground shrink-0 pe-1 text-xs">
              {t("discover.count", { count: response.results.length })}
            </span>
          ) : null}
        </div>
        {deep && response && response.queries.length > 0 ? (
          <ul aria-label={t("discover.queries")} className="flex flex-wrap gap-1 px-1">
            {response.queries.map((query) => (
              <li key={query} className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                {query}
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      {response ? (
        <DiscoverPicker notebookId={notebookId} results={response.results} onDone={flow.close} />
      ) : (
        <DiscoverResultsSkeleton deep={deep} />
      )}
    </section>
  )
}
