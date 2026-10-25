import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export type CalendarGridColumn = { key: string; label: string; sublabel?: string; highlight?: boolean }
export type CalendarGridRow = { key: string; label: string; sublabel?: string }

/**
 * Grid for a week (columns are days, rows are periods) or a day (one column). The header row and the first
 * column stay in place while the body scrolls sideways, so it works at 360 px.
 */
export function CalendarGrid({
  columns,
  rows,
  renderCell,
  minColumnWidth = 160,
  cornerLabel,
  className,
}: {
  columns: CalendarGridColumn[]
  rows: CalendarGridRow[]
  renderCell: (rowKey: string, columnKey: string) => ReactNode
  /** px; below `columns * minColumnWidth` the grid scrolls horizontally. */
  minColumnWidth?: number
  /** Screen-reader name of the empty top-left cell (for example "Period"). */
  cornerLabel?: string
  className?: string
}) {
  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border", className)}>
      <table
        className="w-full border-separate border-spacing-0 text-sm"
        style={{ minWidth: 80 + columns.length * minColumnWidth }}
      >
        <thead>
          <tr>
            <th scope="col" className="bg-muted sticky top-0 left-0 z-20 w-20 border-b border-e p-2">
              <span className="sr-only">{cornerLabel}</span>
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "bg-muted sticky top-0 z-10 border-b p-2 text-start font-medium",
                  column.highlight && "text-primary",
                )}
              >
                <div>{column.label}</div>
                {column.sublabel ? (
                  <div className="text-muted-foreground text-xs font-normal">{column.sublabel}</div>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th
                scope="row"
                className="bg-background sticky left-0 z-10 w-20 border-b border-e p-2 text-start align-top font-medium"
              >
                <div>{row.label}</div>
                {row.sublabel ? <div className="text-muted-foreground text-xs font-normal">{row.sublabel}</div> : null}
              </th>
              {columns.map((column) => (
                <td key={column.key} className={cn("border-b p-1.5 align-top", column.highlight && "bg-accent/30")}>
                  {renderCell(row.key, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
