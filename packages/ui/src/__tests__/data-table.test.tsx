import { afterEach, describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { screen, within } from "@testing-library/react"
import { act } from "react"
import { DataTable } from "../components/ui/table/data-table"
import { MarkBadge, markTone } from "../components/mark-badge"

type Row = { name: string; group: string; gpa: number }

const rows: Row[] = [
  { name: "Brastilov Aleksey", group: "2TN2", gpa: 4.6 },
  { name: "Ivanova Maria", group: "2TN2", gpa: 3.9 },
]

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Student" },
  { accessorKey: "group", header: "Group" },
  { accessorKey: "gpa", header: "GPA" },
]

function Example({ cardLayout }: { cardLayout?: boolean }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  return <DataTable table={table} cardLayout={cardLayout} />
}

function setWidth(width: number) {
  act(() => {
    window.innerWidth = width
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setWidth(1280))

describe("DataTable cardLayout", () => {
  it("renders rows as cards below 768 px", () => {
    window.innerWidth = 360
    renderWithProviders(<Example cardLayout />)

    const cards = screen.getByTestId("data-table-cards")
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(within(cards).getAllByRole("listitem")).toHaveLength(2)
    const first = within(cards).getAllByRole("listitem")[0]!
    expect(first).toHaveTextContent("Brastilov Aleksey")
    expect(first).toHaveTextContent("Group")
    expect(first).toHaveTextContent("2TN2")
    expect(first).toHaveTextContent("4.6")
  })

  it("renders a table from 768 px up, even with cardLayout", () => {
    window.innerWidth = 1024
    renderWithProviders(<Example cardLayout />)

    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.queryByTestId("data-table-cards")).not.toBeInTheDocument()
  })

  it("switches layout when the window is resized", () => {
    window.innerWidth = 1024
    renderWithProviders(<Example cardLayout />)
    expect(screen.getByRole("table")).toBeInTheDocument()

    setWidth(360)

    expect(screen.getByTestId("data-table-cards")).toBeInTheDocument()
  })

  it("keeps the table on phones when cardLayout is not set", () => {
    window.innerWidth = 360
    renderWithProviders(<Example />)

    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})

describe("MarkBadge", () => {
  it("colors marks 2 to 5 and rounds averages to the nearest mark", () => {
    expect([2, 3, 4, 5].map(markTone)).toEqual([2, 3, 4, 5])
    expect(markTone(4.6)).toBe(5)
    expect(markTone(2.2)).toBe(2)
  })

  it("shows a dash without a mark and one decimal for an average", () => {
    renderWithProviders(
      <>
        <MarkBadge mark={null} />
        <MarkBadge mark={4.25} />
        <MarkBadge mark={5} />
      </>,
    )

    expect(screen.getByText("–")).toBeInTheDocument()
    expect(screen.getByText("4.3")).toHaveAttribute("data-mark", "4")
    expect(screen.getByText("5")).toHaveAttribute("data-mark", "5")
  })
})
