"use client"

import * as React from "react"

import { useIsMobile } from "../../../hooks/use-mobile"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table"

export type ResponsiveColumn<TRow> = {
  id: string
  header: React.ReactNode
  cell: (row: TRow) => React.ReactNode
  /** On a card: `title` is the heading, `action` goes top right, others are "label: value" lines. */
  role?: "title" | "action"
  headClassName?: string
  cellClassName?: string
}

type ResponsiveTableProps<TRow> = {
  label: string
  rows: readonly TRow[]
  rowKey: (row: TRow) => React.Key
  columns: ResponsiveColumn<TRow>[]
  /** Shown above the cards, for what the table keeps in its header (such as "select all"). */
  cardsHeader?: React.ReactNode
}

/** A light table for static rows: a real table from 768 px, labelled cards on phones. For paged data use `DataTable`. */
export function ResponsiveTable<TRow>({ label, rows, rowKey, columns, cardsHeader }: ResponsiveTableProps<TRow>) {
  const isMobile = useIsMobile()

  if (isMobile) {
    const titles = columns.filter((column) => column.role === "title")
    const actions = columns.filter((column) => column.role === "action")
    const lines = columns.filter((column) => !column.role)
    return (
      <div className="flex flex-col gap-2">
        {cardsHeader}
        <ul aria-label={label} className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={rowKey(row)} className="bg-card flex flex-col gap-2 rounded-card border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-medium break-words">
                  {titles.map((column) => (
                    <div key={column.id}>{column.cell(row)}</div>
                  ))}
                </div>
                {actions.map((column) => (
                  <div key={column.id} className="shrink-0">
                    {column.cell(row)}
                  </div>
                ))}
              </div>
              {lines.length > 0 ? (
                <dl className="flex flex-col gap-1">
                  {lines.map((column) => (
                    <div key={column.id} className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground text-xs">{column.header}</dt>
                      <dd className="min-w-0 text-end break-words">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border">
      <Table aria-label={label}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} className={column.headClassName}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((column) => (
                <TableCell key={column.id} className={column.cellClassName}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
