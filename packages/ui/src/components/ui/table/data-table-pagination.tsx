import { useT } from "@ihsp/i18n"
import type { Table } from "@tanstack/react-table"
import { Icons } from "../../icons"

import { Button } from "../button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../select"
import { cn } from "../../../lib/utils"

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const t = useT()
  return (
    <div
      className={cn("flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8", className)}
      {...props}
    >
      <div className="text-muted-foreground text-sm whitespace-nowrap">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <>
            {t("table.selectedOf", {
              selected: table.getFilteredSelectedRowModel().rows.length,
              total: table.getFilteredRowModel().rows.length,
            })}
          </>
        ) : (
          <>{t("table.total", { total: table.getFilteredRowModel().rows.length })}</>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
        <div className="hidden items-center space-x-2 sm:flex">
          <p className="text-sm font-medium whitespace-nowrap">{t("table.rowsPerPage")}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger aria-label={t("table.rowsPerPage")} className="h-8 w-[4.5rem] [&[data-size]]:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
          {t("table.pageOf", { page: table.getState().pagination.pageIndex + 1, pages: table.getPageCount() })}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            aria-label={t("table.first")}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <Icons.chevronsLeft />
          </Button>
          <Button
            aria-label={t("table.previous")}
            variant="outline"
            size="icon"
            className="size-11 md:size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icons.chevronLeft />
          </Button>
          <Button
            aria-label={t("table.next")}
            variant="outline"
            size="icon"
            className="size-11 md:size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Icons.chevronRight />
          </Button>
          <Button
            aria-label={t("table.last")}
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <Icons.chevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
