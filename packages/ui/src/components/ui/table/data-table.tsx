"use client"

import { useT } from "@ihsp/i18n"
import { type Cell, type Row, type Table as TanstackTable, flexRender } from "@tanstack/react-table"
import type * as React from "react"

import { useIsMobile } from "../../../hooks/use-mobile"
import { getCommonPinningStyles } from "../../../lib/data-table"
import { ScrollArea, ScrollBar } from "../scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>
  actionBar?: React.ReactNode
  /**
   * Below 768 px the rows are shown as cards instead of a wide table.
   * `true`: automatic cards (the first column is the title, the other columns are "label: value" lines;
   * a column without a header, such as row actions, goes to the top right).
   * A function renders each card itself.
   */
  cardLayout?: boolean | ((row: Row<TData>) => React.ReactNode)
}

function columnLabel<TData>(cell: Cell<TData, unknown>): string | null {
  const meta = cell.column.columnDef.meta
  if (meta?.label) return meta.label
  const header = cell.column.columnDef.header
  return typeof header === "string" ? header : null
}

function AutoCard<TData>({ row }: { row: Row<TData> }) {
  const cells = row.getVisibleCells()
  const labelled = cells.filter((cell) => columnLabel(cell) !== null)
  const [title, ...details] = labelled
  const unlabelled = cells.filter((cell) => columnLabel(cell) === null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 font-medium">
          {title ? flexRender(title.column.columnDef.cell, title.getContext()) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {unlabelled.map((cell) => (
            <div key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
          ))}
        </div>
      </div>
      {details.length > 0 && (
        <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
          {details.map((cell) => (
            <div key={cell.id} className="contents">
              <dt className="text-muted-foreground">{columnLabel(cell)}</dt>
              <dd className="min-w-0 break-words">{flexRender(cell.column.columnDef.cell, cell.getContext())}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function DataTableCards<TData>({
  table,
  cardLayout,
}: {
  table: TanstackTable<TData>
  cardLayout: true | ((row: Row<TData>) => React.ReactNode)
}) {
  const t = useT()
  const rows = table.getRowModel().rows
  if (!rows.length) {
    return (
      <p role="status" className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
        {t("table.noResults")}
      </p>
    )
  }
  return (
    <ul data-testid="data-table-cards" className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
          className="bg-card data-[state=selected]:bg-muted rounded-lg border p-3"
        >
          {cardLayout === true ? <AutoCard row={row} /> : cardLayout(row)}
        </li>
      ))}
    </ul>
  )
}

export function DataTable<TData>({ table, actionBar, cardLayout, children }: DataTableProps<TData>) {
  const t = useT()
  const isMobile = useIsMobile()
  const showCards = Boolean(cardLayout) && isMobile

  return (
    <div className="flex flex-1 flex-col space-y-4">
      {children}
      {showCards && cardLayout ? (
        <DataTableCards table={table} cardLayout={cardLayout} />
      ) : (
        <div className="relative flex flex-1">
          <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
            <ScrollArea className="h-full w-full">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          style={{
                            ...getCommonPinningStyles({ column: header.column }),
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              ...getCommonPinningStyles({ column: cell.column }),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                        {t("table.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {actionBar && table.getFilteredSelectedRowModel().rows.length > 0 && actionBar}
      </div>
    </div>
  )
}
