import { describe, expect, it } from "bun:test"
import { artifactDetailOf, artifactDataTable, dataTableContent } from "@ihsp/test-utils"
import { sourcesText, tableCells, tableToCsv, tableToTsv } from "./table-export"

const detail = artifactDetailOf(artifactDataTable)
const refsIndex = detail.refs_index
const page = (value: number) => `Page ${value}`

describe("table export", () => {
  it("builds the header and the cells in the order given", () => {
    const reversed = dataTableContent.rows.toReversed()
    const cells = tableCells(dataTableContent, reversed)
    expect(cells[0]).toEqual(["Stage", "Place", "Needs light", "Order"])
    expect(cells[1]?.[0]).toBe("Sugar output")
    expect(cells).toHaveLength(5)
  })

  it("lists the source of every ref once, with the page when there is one", () => {
    expect(sourcesText(["S1:P5", "S2:P2", "S1:P5", "S9:P9"], refsIndex, page)).toBe(
      "Biology 10.pdf, Page 3; Lesson 5: Photosynthesis",
    )
    expect(sourcesText([], refsIndex, page)).toBe("")
  })

  it("makes TSV without the sources", () => {
    const lines = tableToTsv(dataTableContent, dataTableContent.rows).split("\n")
    expect(lines[0]).toBe("Stage\tPlace\tNeeds light\tOrder")
    expect(lines[1]).toBe("Light reactions\tThylakoid membranes\tYes\t1")
  })

  it("makes CSV with a BOM and a sources column", () => {
    const csv = tableToCsv(dataTableContent, dataTableContent.rows, refsIndex, "Sources", page)
    expect(csv.startsWith("﻿")).toBe(true)
    const lines = csv.slice(1).split("\r\n")
    expect(lines[0]).toBe("Stage,Place,Needs light,Order,Sources")
    expect(lines[1]).toBe('Light reactions,Thylakoid membranes,Yes,1,"Biology 10.pdf, Page 2"')
    expect(lines[2]).toBe('Calvin cycle,Stroma,Not directly,2,"Biology 10.pdf, Page 3; Lesson 5: Photosynthesis"')
  })
})
