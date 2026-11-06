"use client"

import { isNetworkError } from "@ihsp/api"
import { StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"

/**
 * The loading, error, offline and empty states of a query in one place. Data already in the cache (including data
 * restored for offline use) is shown even when a refresh failed.
 */
export function QueryState<T>({
  query,
  isEmpty,
  emptyText,
  emptyAction,
  isFiltered,
  onReset,
  rows,
  skeleton,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error"> & { refetch: () => unknown }
  isEmpty?: (data: T) => boolean
  emptyText?: string
  emptyAction?: ReactNode
  /** A search or filter is active, so an empty result means "nothing matches", with a reset. */
  isFiltered?: boolean
  onReset?: () => void
  rows?: number
  /** A skeleton shaped like the content, shown instead of the rows. */
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}) {
  if (query.data !== undefined) {
    if (isEmpty?.(query.data)) {
      if (isFiltered) return <StateView state="filtered" onReset={onReset} />
      return <StateView state="empty" emptyText={emptyText} action={emptyAction} />
    }
    return <>{children(query.data)}</>
  }
  if (query.isPending) return <StateView state="loading" rows={rows} skeleton={skeleton} />
  if (query.isError) {
    const offline = isNetworkError(query.error)
    return (
      <StateView
        state={offline ? "offline" : "error"}
        error={offline ? undefined : query.error}
        onRetry={() => void query.refetch()}
      />
    )
  }
  return null
}
