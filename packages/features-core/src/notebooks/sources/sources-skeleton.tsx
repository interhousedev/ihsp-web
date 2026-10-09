"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"

/** Rows shaped like source rows while the list loads. */
export function SourcesSkeleton() {
  const t = useT()
  return (
    <div role="status" aria-busy="true" aria-label={t("state.loadingTitle")} className="flex flex-col gap-1 px-1">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex min-h-11 items-center gap-2 px-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="size-5 shrink-0" />
        </div>
      ))}
    </div>
  )
}
