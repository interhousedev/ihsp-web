"use client"

import { isNetworkError } from "@ihsp/api"
import { StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"

/**
 * The loading, error, offline and empty states of a page in one place. Data already in the cache (including data
 * restored for offline use) is shown even when a refresh failed.
 */
export function QueryState<T>({
  query,
  isEmpty,
  emptyText,
  emptyAction,
  rows,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "error" | "refetch">
  isEmpty?: (data: T) => boolean
  emptyText?: string
  emptyAction?: ReactNode
  rows?: number
  children: (data: T) => ReactNode
}) {
  if (query.data !== undefined) {
    if (isEmpty?.(query.data)) return <StateView state="empty" emptyText={emptyText} action={emptyAction} />
    return <>{children(query.data)}</>
  }
  if (query.isPending) return <StateView state="loading" rows={rows} />
  if (query.isError) {
    return (
      <StateView
        state={isNetworkError(query.error) ? "offline" : "error"}
        error={isNetworkError(query.error) ? undefined : query.error}
        onRetry={() => void query.refetch()}
      />
    )
  }
  return null
}
