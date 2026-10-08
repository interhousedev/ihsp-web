"use client"

import { useDataTable } from "@ihsp/ui"
import type { ColumnDef } from "@tanstack/react-table"
import { parseAsInteger, useQueryState } from "nuqs"
import { useEffect } from "react"
import type { ListSource } from "./use-paged-list"

export const DEFAULT_PAGE_SIZE = 20

/**
 * TanStack table over rows loaded from the server. The page and page size live in the URL (`?page=&perPage=`, nuqs);
 * rows of the current page are sliced from what is loaded and the next server page is fetched when the user reaches
 * the end, so "next" stays enabled while the server has more.
 */
export function useAdminTable<T>({
  columns,
  source,
  getRowId,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  columns: ColumnDef<T, unknown>[]
  source: ListSource<T>
  getRowId?: (row: T) => string
  pageSize?: number
}) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(pageSize))
  const { items, hasNextPage, isFetchingNextPage, fetchNextPage } = source

  const start = (Math.max(page, 1) - 1) * perPage
  const loadedPages = Math.max(1, Math.ceil(items.length / perPage))
  const pageCount = hasNextPage ? Math.max(loadedPages, page) + 1 : loadedPages

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && items.length < start + perPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, items.length, start, perPage, fetchNextPage])

  const rows = items.slice(start, start + perPage)
  const { table } = useDataTable<T>({
    data: rows,
    columns,
    pageCount,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })
  return { table, rows, total: items.length }
}
