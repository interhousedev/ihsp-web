import { Checkbox, DataTableColumnHeader } from "@ihsp/ui"
import type { ColumnDef } from "@tanstack/react-table"
import type { ReactNode } from "react"
import type { SortValue } from "./sort-rows"

/**
 * A data column. The label doubles as the "label: value" caption when the table becomes cards on a phone.
 * With `sort`, the header gets the sort menu and the loaded rows are ordered by that value (`sortRows`).
 */
export function col<T>(
  id: string,
  label: string,
  cell: (row: T) => ReactNode,
  options: { sort?: (row: T) => SortValue } = {},
): ColumnDef<T, unknown> {
  const { sort } = options
  return {
    id,
    header: sort ? ({ column }) => <DataTableColumnHeader column={column} title={label} /> : label,
    meta: { label },
    cell: ({ row }) => cell(row.original),
    ...(sort ? { accessorFn: (row: T) => sort(row) } : {}),
    enableSorting: sort !== undefined,
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

export const SELECT_COLUMN_ID = "select"

/**
 * The checkbox column for bulk actions: the header selects every row of the current page, a cell one row. Without a
 * text header it goes to the top right corner of a card on phones.
 */
export function selectCol<T>(labels: { all: string; row: (row: T) => string }): ColumnDef<T, unknown> {
  return {
    id: SELECT_COLUMN_ID,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.all}
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.row(row.original)}
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  }
}
