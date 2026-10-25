import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { screen } from "@testing-library/react"
import { DataTablePagination } from "../components/ui/table/data-table-pagination"

type Row = { name: string }

const rows: Row[] = [{ name: "Brastilov Aleksey" }, { name: "Ivanova Maria" }]
const columns: ColumnDef<Row>[] = [{ accessorKey: "name", header: "Student" }]

function Example({ pageCount }: { pageCount?: number }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(pageCount === undefined ? {} : { manualPagination: true, pageCount }),
  })
  return <DataTablePagination table={table} />
}

describe("DataTablePagination", () => {
  it("prints the page of the known total and the row count", () => {
    renderWithProviders(<Example />)
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument()
    expect(screen.getByText("2 row(s) total.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Last page" })).toBeInTheDocument()
  })

  it("prints only the current page when the page count is unknown (-1)", () => {
    renderWithProviders(<Example pageCount={-1} />)
    expect(screen.getByText("Page 1")).toBeInTheDocument()
    expect(screen.queryByText(/of -1/)).toBeNull()
    expect(screen.queryByText(/total/)).toBeNull()
    expect(screen.queryByRole("button", { name: "First page" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Last page" })).toBeNull()
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument()
  })
})
