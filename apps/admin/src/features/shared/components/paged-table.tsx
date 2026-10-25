"use client"

import { isNetworkError } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DataTable, StateView } from "@ihsp/ui"
import type { ColumnDef, Row } from "@tanstack/react-table"
import type { CSSProperties, ReactNode } from "react"
import { useAdminTable } from "../hooks/use-admin-table"
import type { ListSource } from "../hooks/use-paged-list"

/** Buttons for the selected rows (a `selectCol` must be among the columns); `clear` empties the selection. */
export type SelectionActions<T> = (selected: T[], clear: () => void) => ReactNode

/** "N selected", the bulk buttons and "Clear selection"; shown above the table while something is selected. */
function SelectionBar<T>({
  selected,
  clear,
  actions,
}: {
  selected: T[]
  clear: () => void
  actions: SelectionActions<T>
}) {
  const t = useT("shared.selection")
  return (
    <div
      role="region"
      aria-label={t("region")}
      className="bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
    >
      <span role="status" className="text-sm font-medium">
        {t("count", { count: selected.length })}
      </span>
      <div className="flex flex-wrap items-center gap-2">{actions(selected, clear)}</div>
      <Button type="button" variant="ghost" className="ms-auto" onClick={clear}>
        {t("clear")}
      </Button>
    </div>
  )
}

/** Header, pagination and gaps around the rows, and the height of one row, in pixels. */
const CHROME_HEIGHT = 140
const ROW_HEIGHT = 54

function TableBody<T>({
  source,
  columns,
  getRowId,
  cardLayout,
  renderSelectionActions,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  cardLayout: true | ((row: Row<T>) => ReactNode)
  renderSelectionActions?: SelectionActions<T>
}) {
  const { table, rows, selected, clearSelection } = useAdminTable({ columns, source, getRowId })
  // The starter's table fills its parent, so the parent needs a height: as tall as the rows, at most the viewport.
  const style = { "--table-height": `${CHROME_HEIGHT + Math.max(rows.length, 3) * ROW_HEIGHT}px` } as CSSProperties
  return (
    <>
      {renderSelectionActions && selected.length > 0 ? (
        <SelectionBar selected={selected} clear={clearSelection} actions={renderSelectionActions} />
      ) : null}
      <div style={style} className="flex flex-col md:h-[min(var(--table-height),calc(100dvh-14rem))] md:min-h-72">
        <DataTable table={table} cardLayout={cardLayout} />
      </div>
    </>
  )
}

function Body<T>({
  source,
  columns,
  getRowId,
  emptyText,
  emptyAction,
  cardLayout,
  renderSelectionActions,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  emptyText?: string
  emptyAction?: ReactNode
  cardLayout: true | ((row: Row<T>) => ReactNode)
  renderSelectionActions?: SelectionActions<T>
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
  return (
    <TableBody
      source={source}
      columns={columns}
      getRowId={getRowId}
      cardLayout={cardLayout}
      renderSelectionActions={renderSelectionActions}
    />
  )
}

/**
 * A list page body: the toolbar (always in the same place, so a search box keeps focus while typing), then loading,
 * error, empty or the table (cards on phones). `emptyText` is the message when the list has no rows. With
 * `renderSelectionActions` (and a `selectCol` among the columns) a bar with the bulk buttons appears while rows are selected.
 */
export function PagedTable<T>({
  source,
  columns,
  getRowId,
  toolbar,
  emptyText,
  emptyAction,
  cardLayout = true,
  renderSelectionActions,
}: {
  source: ListSource<T>
  columns: ColumnDef<T, unknown>[]
  getRowId?: (row: T) => string
  toolbar?: ReactNode
  emptyText?: string
  emptyAction?: ReactNode
  cardLayout?: true | ((row: Row<T>) => ReactNode)
  renderSelectionActions?: SelectionActions<T>
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
        renderSelectionActions={renderSelectionActions}
      />
    </div>
  )
}
