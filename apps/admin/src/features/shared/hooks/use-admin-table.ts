"use client"

import { useFormatters } from "@ihsp/i18n"
import { getSortingStateParser, useDataTable } from "@ihsp/ui"
import type { ColumnDef } from "@tanstack/react-table"
import { parseAsInteger, useQueryState } from "nuqs"
import { useEffect, useMemo } from "react"
import { sortRows } from "../utils/sort-rows"
import type { ListSource } from "./use-paged-list"

export const DEFAULT_PAGE_SIZE = 20

/**
 * TanStack table over rows loaded from the server. The page, page size and sort live in the URL
 * (`?page=&perPage=&sort=`, nuqs); rows of the current page are sliced from what is loaded and the next server page is
 * fetched when the user reaches the end, so "next" stays enabled while the server has more.
 *
 * The list endpoints have no `sort` parameter, so sorting orders the rows loaded so far (by the columns' `accessorFn`).
 * The page count is honest: while the server has more rows it is unknown (`-1`: "Page N", next enabled), and a
 * `?page=` past the loaded rows (an old address) is pulled back to the last page.
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
  const { locale } = useFormatters()
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(pageSize))
  const columnIds = useMemo(() => new Set(columns.map((column) => column.id).filter(Boolean) as string[]), [columns])
  const [sorting] = useQueryState("sort", getSortingStateParser<T>(columnIds).withDefault([]))
  const { items, hasNextPage, isFetchingNextPage, fetchNextPage } = source

  const sorted = useMemo(() => sortRows(items, sorting, columns, locale), [items, sorting, columns, locale])
  const start = (Math.max(page, 1) - 1) * perPage
  const loadedPages = Math.max(1, Math.ceil(items.length / perPage))
  const pageCount = hasNextPage ? -1 : loadedPages

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && items.length < start + perPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, items.length, start, perPage, fetchNextPage])

  // An address pointing past the loaded rows (after a reload, or when a filter shrank the list) lands on the last page.
  useEffect(() => {
    if (!hasNextPage && !isFetchingNextPage && page > loadedPages) void setPage(loadedPages)
  }, [hasNextPage, isFetchingNextPage, page, loadedPages, setPage])

  const rows = sorted.slice(start, start + perPage)
  const { table } = useDataTable<T>({
    data: rows,
    columns,
    pageCount,
    getRowId,
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const rowSelection = table.getState().rowSelection
  const selected = useMemo(
    () => (getRowId ? items.filter((row) => rowSelection[getRowId(row)]) : []),
    [items, rowSelection, getRowId],
  )

  return { table, rows, total: items.length, selected, clearSelection: () => table.resetRowSelection() }
}
