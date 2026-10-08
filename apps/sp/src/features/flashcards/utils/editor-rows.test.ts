import { describe, expect, it } from "bun:test"
import { flashcardSetDetail } from "@ihsp/test-utils"
import { incompleteRowKeys, moveRow, newEditorRow, rowsEqual, rowsFromSet, toCardsBody } from "./editor-rows"

describe("card editor rows (WEB-24)", () => {
  it("starts from the cards in set order", () => {
    const shuffled = { ...flashcardSetDetail, cards: flashcardSetDetail.cards.toReversed() }

    const rows = rowsFromSet(shuffled)

    expect(rows.map((row) => row.front)).toEqual(flashcardSetDetail.cards.map((card) => card.front))
  })

  it("moves a row up and down and leaves out-of-range moves alone", () => {
    const rows = rowsFromSet(flashcardSetDetail)

    expect(moveRow(rows, 1, -1).map((row) => row.id)).toEqual([rows[1]?.id, rows[0]?.id, rows[2]?.id, rows[3]?.id])
    expect(moveRow(rows, 0, 1).map((row) => row.id)).toEqual([rows[1]?.id, rows[0]?.id, rows[2]?.id, rows[3]?.id])
    expect(moveRow(rows, 0, -1)).toBe(rows)
    expect(moveRow(rows, 3, 1)).toBe(rows)
  })

  it("sends the full ordered list: saved cards with ids, new cards without", () => {
    const rows = [
      ...rowsFromSet(flashcardSetDetail).slice(0, 2),
      { ...newEditorRow(), front: " New front ", back: "New back" },
    ]

    expect(toCardsBody(rows)).toEqual({
      cards: [
        {
          id: flashcardSetDetail.cards[0]?.id,
          front: flashcardSetDetail.cards[0]?.front,
          back: flashcardSetDetail.cards[0]?.back,
        },
        {
          id: flashcardSetDetail.cards[1]?.id,
          front: flashcardSetDetail.cards[1]?.front,
          back: flashcardSetDetail.cards[1]?.back,
        },
        { front: "New front", back: "New back" },
      ],
    })
  })

  it("flags cards with an empty side", () => {
    const empty = newEditorRow()
    const half = { ...newEditorRow(), front: "Only the front" }
    const full = { ...newEditorRow(), front: "Front", back: "Back" }

    expect([...incompleteRowKeys([empty, half, full])]).toEqual([empty.key, half.key])
  })

  it("tells changed rows from unchanged ones", () => {
    const rows = rowsFromSet(flashcardSetDetail)

    expect(rowsEqual(rows, rowsFromSet(flashcardSetDetail))).toBe(true)
    expect(rowsEqual(rows, moveRow(rows, 0, 1))).toBe(false)
    expect(rowsEqual(rows, rows.slice(1))).toBe(false)
  })
})
