"use client"

import { StateView } from "@ihsp/ui"
import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"

type QueryBoundaryProps<T> = {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
}

/** Loading skeleton, error with retry, then the content of a query. */
export function QueryBoundary<T>({ query, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <StateView state="loading" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  return <>{children(query.data)}</>
}
