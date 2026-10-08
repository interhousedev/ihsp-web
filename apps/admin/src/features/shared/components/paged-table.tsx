"use client"

import { isNetworkError } from "@ihsp/api"
import { DataTable, StateView } from "@ihsp/ui"
import type { ColumnDef, Row } from "@tanstack/react-table"
import type { CSSProperties, ReactNode } from "react"
import { useAdminTable } from "../hooks/use-admin-table"
import type { ListSource } from "../hooks/use-paged-list"

/** Header, pagination and gaps around the rows, and the height of one row, in pixels. */
const CHROME_HEIGHT = 140
const ROW_HEIGHT = 54

function TableBody<T>({
  source,
  columns,
  getRowId,
  cardLayout,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  cardLayout: true | ((row: Row<T>) => ReactNode)
}) {
  const { table, rows } = useAdminTable({ columns, source, getRowId })
  // The starter's table fills its parent, so the parent needs a height: as tall as the rows, at most the viewport.
  const style = { "--table-height": `${CHROME_HEIGHT + Math.max(rows.length, 3) * ROW_HEIGHT}px` } as CSSProperties
  return (
    <div style={style} className="flex flex-col md:h-[min(var(--table-height),calc(100dvh-14rem))] md:min-h-72">
      <DataTable table={table} cardLayout={cardLayout} />
    </div>
  )
}

function Body<T>({
  source,
  columns,
  getRowId,
  emptyText,
  emptyAction,
  cardLayout,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  emptyText?: string
  emptyAction?: ReactNode
  cardLayout: true | ((row: Row<T>) => ReactNode)
}) {
  if (source.isPending) return <StateView state="loading" rows={5} />
  if (source.items.length === 0) {
    if (source.isError) {
      const offline = isNetworkError(source.error)
      return (
        <StateView
          state={offline ? "offline" : "error"}
          error={offline ? undefined : source.error}
          onRetry={source.refetch}
        />
      )
    }
    return <StateView state="empty" emptyText={emptyText} action={emptyAction} />
  }
  return <TableBody source={source} columns={columns} getRowId={getRowId} cardLayout={cardLayout} />
}

/**
 * A list page body: the toolbar (always in the same place, so a search box keeps focus while typing), then loading,
 * error, empty or the table (cards on phones). `emptyText` is the message when the list has no rows.
 */
export function PagedTable<T>({
  source,
  columns,
  getRowId,
  toolbar,
  emptyText,
  emptyAction,
  cardLayout = true,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  toolbar?: ReactNode
  emptyText?: string
  emptyAction?: ReactNode
  cardLayout?: true | ((row: Row<T>) => ReactNode)
}) {
  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <Body
        source={source}
        columns={columns}
        getRowId={getRowId}
        emptyText={emptyText}
        emptyAction={emptyAction}
        cardLayout={cardLayout}
      />
    </div>
  )
}
