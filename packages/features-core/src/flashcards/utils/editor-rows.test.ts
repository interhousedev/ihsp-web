import { describe, expect, it } from "bun:test"
import {
  filledRows,
  incompleteRowKeys,
  insertImported,
  moveRow,
  moveRowTo,
  newEditorRow,
  rowsEqual,
  rowsFromSet,
  toCardsBody,
  tooLongRowKeys,
  type EditorRow,
} from "./editor-rows"

const rows: EditorRow[] = [
  { key: "a", id: "a", front: "A", back: "a" },
  { key: "b", id: "b", front: "B", back: "b" },
  { key: "c", front: "C", back: "c" },
]

describe("rowsFromSet", () => {
  it("orders the cards by position and keeps their ids", () => {
    const result = rowsFromSet({
      cards: [
        { id: "2", position: 2, front: "B", back: "b", state: "new", due_at: null },
        { id: "1", position: 1, front: "A", back: "a", state: "new", due_at: null },
      ],
    })

    expect(result).toEqual([
      { key: "1", id: "1", front: "A", back: "a" },
      { key: "2", id: "2", front: "B", back: "b" },
    ])
  })
})

describe("moving rows", () => {
  it("moveRow moves one place and ignores moves out of range", () => {
    expect(moveRow(rows, 0, 1).map((row) => row.key)).toEqual(["b", "a", "c"])
    expect(moveRow(rows, 2, -1).map((row) => row.key)).toEqual(["a", "c", "b"])
    expect(moveRow(rows, 0, -1)).toBe(rows)
    expect(moveRow(rows, 2, 1)).toBe(rows)
  })

  it("moveRowTo is what a finished drag does", () => {
    expect(moveRowTo(rows, 0, 2).map((row) => row.key)).toEqual(["b", "c", "a"])
    expect(moveRowTo(rows, 2, 0).map((row) => row.key)).toEqual(["c", "a", "b"])
    expect(moveRowTo(rows, 1, 1)).toBe(rows)
    expect(moveRowTo(rows, -1, 1)).toBe(rows)
  })
})

describe("saving", () => {
  it("sends the filled rows in order, trimmed, with ids only for saved cards", () => {
    const body = toCardsBody([
      { key: "a", id: "a", front: " A ", back: "a" },
      newEditorRow("", ""),
      { key: "n", front: "N", back: " n " },
    ])

    expect(body).toEqual({
      cards: [
        { id: "a", front: "A", back: "a" },
        { front: "N", back: "n" },
      ],
    })
  })

  it("filledRows drops the rows that are blank on both sides", () => {
    expect(filledRows([newEditorRow(), { key: "x", front: " ", back: "b" }]).map((row) => row.key)).toEqual(["x"])
  })

  it("flags rows with only one side, but not blank rows", () => {
    const flagged = incompleteRowKeys([
      { key: "one", front: "A", back: "" },
      { key: "two", front: "", back: "b" },
      { key: "blank", front: "", back: "" },
      { key: "ok", front: "A", back: "a" },
    ])

    expect([...flagged].toSorted()).toEqual(["one", "two"])
  })

  it("flags rows with a side longer than the limit", () => {
    expect([
      ...tooLongRowKeys(
        [
          { key: "long", front: "xxx", back: "a" },
          { key: "ok", front: "x", back: "a" },
        ],
        2,
      ),
    ]).toEqual(["long"])
  })

  it("rowsEqual compares ids, front and back in order", () => {
    expect(rowsEqual(rows, [...rows])).toBe(true)
    expect(rowsEqual(rows, moveRow(rows, 0, 1))).toBe(false)
    expect(rowsEqual(rows, rows.slice(0, 2))).toBe(false)
  })
})

describe("insertImported", () => {
  const imported = [
    { front: "x", back: "1" },
    { front: "y", back: "2" },
  ]

  it("appends at the end without an anchor", () => {
    const result = insertImported(rows, imported)

    expect(result.map((row) => row.front)).toEqual(["A", "B", "C", "x", "y"])
  })

  it("drops the spare blank rows when appending", () => {
    const result = insertImported([rows[0] as EditorRow, newEditorRow(), newEditorRow()], imported)

    expect(result.map((row) => row.front)).toEqual(["A", "x", "y"])
  })

  it("inserts after the row where the text was pasted", () => {
    expect(insertImported(rows, imported, "a").map((row) => row.front)).toEqual(["A", "x", "y", "B", "C"])
  })

  it("replaces the blank row where the text was pasted", () => {
    const blank = newEditorRow()

    const result = insertImported([rows[0] as EditorRow, blank], imported, blank.key)

    expect(result.map((row) => row.front)).toEqual(["A", "x", "y"])
  })

  it("does nothing for an empty import", () => {
    expect(insertImported(rows, [])).toBe(rows)
  })
})
