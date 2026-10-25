"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"

const ROWS = 3

/** Three rows shaped like found pages while Discover searches; a deep search says how long it may take. */
export function DiscoverResultsSkeleton({ deep }: { deep: boolean }) {
  const t = useT("notebooks")
  const root = useT()
  return (
    <div role="status" aria-busy="true" aria-label={root("state.loadingTitle")} className="flex flex-col gap-1.5">
      {deep ? <p className="text-muted-foreground px-1 text-xs">{t("discover.searching")}</p> : null}
      {Array.from({ length: ROWS }, (_, index) => (
        <div key={index} className="flex items-start gap-3 rounded-lg border px-3 py-2">
          <Skeleton className="mt-0.5 size-5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
