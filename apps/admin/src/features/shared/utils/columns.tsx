import type { ColumnDef } from "@tanstack/react-table"
import type { ReactNode } from "react"

/** A data column. The label doubles as the "label: value" caption when the table becomes cards on a phone. */
export function col<T>(id: string, label: string, cell: (row: T) => ReactNode): ColumnDef<T, unknown> {
  return {
    id,
    header: label,
    meta: { label },
    cell: ({ row }) => cell(row.original),
    enableSorting: false,
    enableHiding: false,
  }
}

/**
 * The buttons column. Its header has no text (only a screen-reader label), so the card layout puts it in the
 * top right corner of the card.
 */
export function actionsCol<T>(label: string, cell: (row: T) => ReactNode): ColumnDef<T, unknown> {
  return {
    id: "actions",
    header: () => <span className="sr-only">{label}</span>,
    cell: ({ row }) => <div className="flex items-center justify-end gap-1">{cell(row.original)}</div>,
    enableSorting: false,
    enableHiding: false,
  }
}
