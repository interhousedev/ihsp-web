import { afterEach, describe, expect, it, spyOn } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import { artifactDataTable, artifactDetailOf, dataTableContent, nbIds } from "@ihsp/test-utils"
import { act, screen, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { DataTableViewer } from "./data-table-viewer"

allowSlowRenders()

afterEach(() => {
  window.innerWidth = 1280
})

type TableArtifact = Extract<ArtifactDetail, { kind: "data_table" }>

function tableArtifact(extra: Partial<TableArtifact> = {}): TableArtifact {
  const detail = artifactDetailOf(artifactDataTable)
  if (detail.kind !== "data_table") throw new Error("fixture is not a table")
  return { ...detail, ...extra }
}

function renderTable(extra: Partial<TableArtifact> = {}) {
  return renderNotebook(<DataTableViewer notebookId={nbIds.notebook} artifact={tableArtifact(extra)} />)
}

const stageHeader = () => screen.getByRole("columnheader", { name: /Stage/ })

/** The title (first value) of every card on a phone. */
const cardTitles = () =>
  screen.getAllByRole("listitem").map((card) => within(card).getAllByRole("definition")[0]?.textContent)

/** The text of the first cell of every body row. */
function firstColumn(): string[] {
  const [, ...bodyRows] = screen.getAllByRole("row")
  return bodyRows.map((row) => within(row).getAllByRole("rowheader")[0]?.textContent ?? "")
}

describe("DataTableViewer: the table", () => {
  it("shows a header button per column, a Sources column and a row per entry with its chips", () => {
    renderTable()

    for (const column of dataTableContent.columns) {
      expect(screen.getByRole("columnheader", { name: new RegExp(column.label) })).toBeInTheDocument()
    }
    expect(screen.getByRole("columnheader", { name: "Sources" })).toBeInTheDocument()
    expect(firstColumn()).toEqual(["Light reactions", "Calvin cycle", "Water splitting", "Sugar output"])
    expect(screen.getAllByRole("button", { name: /^Source \d: / })).toHaveLength(5)
    expect(screen.getByRole("table", { name: "Stages of photosynthesis" })).toBeInTheDocument()
  })

  it("sorts by a text column ascending, descending and back to the stored order", async () => {
    const { user } = renderTable()
    expect(stageHeader()).toHaveAttribute("aria-sort", "none")

    await user.click(within(stageHeader()).getByRole("button"))
    expect(stageHeader()).toHaveAttribute("aria-sort", "ascending")
    expect(firstColumn()).toEqual(["Calvin cycle", "Light reactions", "Sugar output", "Water splitting"])

    await user.click(within(stageHeader()).getByRole("button"))
    expect(stageHeader()).toHaveAttribute("aria-sort", "descending")
    expect(firstColumn()).toEqual(["Water splitting", "Sugar output", "Light reactions", "Calvin cycle"])

    await user.click(within(stageHeader()).getByRole("button"))
    expect(stageHeader()).toHaveAttribute("aria-sort", "none")
    expect(firstColumn()).toEqual(["Light reactions", "Calvin cycle", "Water splitting", "Sugar output"])
  })

  it("sorts a number column by value and moves the sort mark to the clicked column", async () => {
    const { user } = renderTable()

    await user.click(within(screen.getByRole("columnheader", { name: /Order/ })).getByRole("button"))
    await user.click(within(screen.getByRole("columnheader", { name: /Order/ })).getByRole("button"))

    expect(firstColumn()[0]).toBe("Sugar output")
    expect(screen.getByRole("columnheader", { name: /Order/ })).toHaveAttribute("aria-sort", "descending")

    await user.click(within(screen.getByRole("columnheader", { name: /Place/ })).getByRole("button"))
    expect(screen.getByRole("columnheader", { name: /Order/ })).toHaveAttribute("aria-sort", "none")
    expect(screen.getByRole("columnheader", { name: /Place/ })).toHaveAttribute("aria-sort", "ascending")
  })

  it("keeps the header and the first column in place while scrolling", () => {
    renderTable()

    expect(screen.getAllByRole("rowgroup")[0]).toHaveClass("sticky")
    expect(screen.getByRole("columnheader", { name: /Stage/ })).toHaveClass("sticky")
    expect(screen.getAllByRole("rowheader")[0]).toHaveClass("sticky")
  })

  it("says so when the table has no rows", () => {
    renderTable({ content: { ...dataTableContent, rows: [] } })

    expect(screen.getByText("This table has no rows.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Copy as TSV" })).toBeDisabled()
  })
})

describe("DataTableViewer: copy and download", () => {
  it("copies the header and the rows as TSV in the order on screen", async () => {
    const { user } = renderTable()
    await user.click(within(screen.getByRole("columnheader", { name: /Stage/ })).getByRole("button"))

    await user.click(screen.getByRole("button", { name: "Copy as TSV" }))

    const lines = (await navigator.clipboard.readText()).split("\n")
    expect(lines).toEqual([
      "Stage\tPlace\tNeeds light\tOrder",
      "Calvin cycle\tStroma\tNot directly\t2",
      "Light reactions\tThylakoid membranes\tYes\t1",
      "Sugar output\tStroma\tNot directly\t3",
      "Water splitting\tPhotosystem II\tYes\t1",
    ])
  })

  it("downloads a CSV with a BOM and a sources column", async () => {
    const blobs: Blob[] = []
    const files: string[] = []
    spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return "blob:table"
    })
    spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      files.push(this.download)
    })
    const { user } = renderTable()

    await user.click(screen.getByRole("button", { name: "Download CSV" }))

    expect(click).toHaveBeenCalledTimes(1)
    expect(files).toEqual(["stages-of-photosynthesis.csv"])
    const text = (await blobs[0]?.text()) ?? ""
    expect(text.startsWith("﻿")).toBe(true)
    const lines = text.slice(1).split("\r\n")
    expect(lines[0]).toBe("Stage,Place,Needs light,Order,Sources")
    expect(lines[1]).toBe('Light reactions,Thylakoid membranes,Yes,1,"Biology 10.pdf, Page 2"')
    expect(lines[2]).toBe('Calvin cycle,Stroma,Not directly,2,"Biology 10.pdf, Page 3; Lesson 5: Photosynthesis"')
    expect(lines).toHaveLength(5)
  })
})

describe("DataTableViewer: on a phone", () => {
  it("shows every row as a card of label and value pairs, with its sources", () => {
    window.innerWidth = 360
    renderTable()

    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    const cards = screen.getAllByRole("listitem")
    expect(cards).toHaveLength(4)
    expect(within(cards[0]!).getByText("Place")).toBeInTheDocument()
    expect(within(cards[0]!).getByText("Thylakoid membranes")).toBeInTheDocument()
    expect(within(cards[1]!).getAllByRole("button", { name: /^Source \d: / })).toHaveLength(2)
  })

  it("sorts with the select and the direction button", async () => {
    window.innerWidth = 360
    const { user } = renderTable()

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "Order")
    expect(cardTitles()).toEqual(["Light reactions", "Water splitting", "Calvin cycle", "Sugar output"])

    await user.click(screen.getByRole("button", { name: "Ascending" }))
    expect(cardTitles()).toEqual(["Sugar output", "Calvin cycle", "Light reactions", "Water splitting"])
    expect(screen.getByRole("button", { name: "Descending" })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "No sorting")
    expect(cardTitles()[0]).toBe("Light reactions")
  })

  it("switches layout when the window is resized", () => {
    renderTable()
    expect(screen.getByRole("table")).toBeInTheDocument()

    act(() => {
      window.innerWidth = 360
      window.dispatchEvent(new Event("resize"))
    })

    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
