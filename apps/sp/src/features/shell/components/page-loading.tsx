"use client"

import { StateView } from "@ihsp/ui"

/** Shown while a page reads its address (`useSearchParams`) or its messages: the static HTML has no data yet. */
export function PageLoading() {
  return (
    <div className="px-4 pt-4">
      <StateView state="loading" />
    </div>
  )
}
