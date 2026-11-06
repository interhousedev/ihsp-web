import { afterEach, describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { ResponsiveTable, type ResponsiveColumn } from "../components/ui/table/responsive-table"

type Row = { id: string; name: string; group: string }

const rows: Row[] = [{ id: "1", name: "Ivanova Maria", group: "2TN2" }]
const columns: ResponsiveColumn<Row>[] = [
  { id: "name", header: "Student", role: "title", cell: (row) => row.name },
  { id: "group", header: "Group", cell: (row) => row.group },
  { id: "open", header: <span className="sr-only">Open</span>, role: "action", cell: () => <button>Open</button> },
]
const desktopWidth = window.innerWidth

afterEach(() => {
  setWidth(desktopWidth)
})

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width })
}

describe("ResponsiveTable", () => {
  it("renders a real table from 768 px", () => {
    setWidth(1280)
    renderWithProviders(<ResponsiveTable label="Students" rows={rows} rowKey={(row) => row.id} columns={columns} />)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Student" })).toBeInTheDocument()
  })

  it("renders labelled cards without a table below 768 px", () => {
    setWidth(360)
    renderWithProviders(<ResponsiveTable label="Students" rows={rows} rowKey={(row) => row.id} columns={columns} />)
    expect(screen.queryByRole("table")).toBeNull()
    const card = within(screen.getByRole("list", { name: "Students" })).getByRole("listitem")
    expect(card).toHaveClass("rounded-card")
    expect(within(card).getByText("Ivanova Maria")).toBeInTheDocument()
    expect(within(card).getByText("Group")).toBeInTheDocument()
    expect(within(card).getByText("2TN2")).toBeInTheDocument()
    expect(within(card).getByRole("button", { name: "Open" })).toBeInTheDocument()
  })

  it("shows the phone toolbar only on phones", () => {
    setWidth(360)
    renderWithProviders(
      <ResponsiveTable
        label="Students"
        rows={rows}
        rowKey={(row) => row.id}
        columns={columns}
        cardsHeader={<p>Select all</p>}
      />,
    )
    expect(screen.getByText("Select all")).toBeInTheDocument()
  })
})
