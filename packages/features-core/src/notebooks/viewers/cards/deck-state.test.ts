import { describe, expect, it } from "bun:test"
import {
  counts,
  deleteCard,
  freshDeck,
  isFinished,
  mark,
  move,
  parseDeck,
  queueOf,
  restart,
  shuffleDeck,
  verdictOf,
} from "./deck-state"

const ids = ["c1", "c2", "c3", "c4"]

describe("parseDeck", () => {
  it("restores a saved deck", () => {
    const saved = { known: ["c1"], missed: ["c2"], deleted: ["c4"], order: ["c3", "c1", "c2", "c4"], position: 1 }
    expect(parseDeck(saved, ids)).toEqual(saved)
  })

  it("starts fresh from anything that is not a deck", () => {
    for (const raw of [
      null,
      undefined,
      5,
      "x",
      [],
      {},
      { known: "c1" },
      { known: [], missed: [], deleted: [], order: [] },
    ]) {
      expect(parseDeck(raw, ids)).toEqual(freshDeck(ids))
    }
  })

  it("drops cards that no longer exist and duplicates", () => {
    const parsed = parseDeck(
      { known: ["c1", "c1", "zz"], missed: ["c1", "c2"], deleted: [], order: ["c2", "c2", "c1", "zz"], position: 0 },
      ids,
    )
    expect(parsed.known).toEqual(["c1"])
    expect(parsed.missed).toEqual(["c2"])
    expect(parsed.order).toEqual(["c2", "c1"])
  })

  it("clamps the position into the queue", () => {
    expect(parseDeck({ ...freshDeck(ids), position: 99 }, ids).position).toBe(3)
    expect(parseDeck({ ...freshDeck(ids), position: -4 }, ids).position).toBe(0)
  })

  it("starts over when the saved round has no cards left but some cards exist", () => {
    const parsed = parseDeck({ known: [], missed: [], deleted: ["c1"], order: ["zz"], position: 0 }, ids)
    expect(queueOf(parsed)).toEqual(["c2", "c3", "c4"])
    expect(parsed.deleted).toEqual(["c1"])
  })
})

describe("mark and move", () => {
  it("marks the card and moves to the next unmarked one", () => {
    const next = mark(freshDeck(ids), "c1", "known")
    expect(verdictOf(next, "c1")).toBe("known")
    expect(next.position).toBe(1)
  })

  it("wraps around to an earlier unmarked card", () => {
    let deck = move(freshDeck(ids), 3)
    deck = mark(deck, "c4", "missed")
    expect(deck.position).toBe(0)
  })

  it("changes a mark instead of counting a card twice", () => {
    let deck = mark(freshDeck(ids), "c1", "known")
    deck = mark(deck, "c1", "missed")
    expect(deck.known).toEqual([])
    expect(deck.missed).toEqual(["c1"])
  })

  it("finishes when every card of the queue is marked", () => {
    let deck = freshDeck(ids)
    for (const id of ids.slice(0, 3)) deck = mark(deck, id, "known")
    expect(isFinished(deck)).toBe(false)
    deck = mark(deck, "c4", "missed")
    expect(isFinished(deck)).toBe(true)
    expect(counts(deck)).toEqual({ known: 3, missed: 1, total: 4 })
  })

  it("stops at the ends when moving", () => {
    expect(move(freshDeck(ids), -1).position).toBe(0)
    expect(move(move(freshDeck(ids), 10), 1).position).toBe(3)
  })
})

describe("shuffleDeck, deleteCard and restart", () => {
  it("shuffles the order, keeps the cards and the marks, and goes back to the first card", () => {
    const marked = mark(freshDeck(ids), "c1", "known")
    const shuffled = shuffleDeck(marked, () => 0)
    expect(shuffled.order).not.toEqual(ids)
    expect([...shuffled.order].toSorted()).toEqual(ids)
    expect(shuffled.known).toEqual(["c1"])
    expect(shuffled.position).toBe(0)
  })

  it("deletes a card from the queue and its marks", () => {
    const marked = mark(move(freshDeck(ids), 1), "c2", "missed")
    expect(marked.position).toBe(2)
    const deck = deleteCard(move(marked, -1), "c2")
    expect(queueOf(deck)).toEqual(["c1", "c3", "c4"])
    expect(deck.missed).toEqual([])
    expect(deck.position).toBe(1)
  })

  it("keeps the position valid when the last card is deleted", () => {
    const deck = deleteCard(move(freshDeck(ids), 3), "c4")
    expect(deck.position).toBe(2)
  })

  it("restarts the same round without marks", () => {
    let deck = shuffleDeck(freshDeck(ids), () => 0)
    deck = mark(deck, queueOf(deck)[0] ?? "", "known")
    const again = restart(deck, "same", ids)
    expect(again.order).toEqual(deck.order)
    expect(again.known).toEqual([])
    expect(again.position).toBe(0)
  })

  it("restarts with all cards that were not deleted, in the original order", () => {
    let deck = deleteCard(
      shuffleDeck(freshDeck(ids), () => 0),
      "c3",
    )
    deck = mark(deck, queueOf(deck)[0] ?? "", "missed")
    expect(restart(deck, "all", ids).order).toEqual(["c1", "c2", "c4"])
  })

  it("restarts with only the missed cards", () => {
    let deck = freshDeck(ids)
    deck = mark(deck, "c1", "known")
    deck = mark(deck, "c2", "missed")
    deck = mark(deck, "c3", "known")
    deck = mark(deck, "c4", "missed")
    const again = restart(deck, "missed", ids)
    expect(again.order).toEqual(["c2", "c4"])
    expect(again.missed).toEqual([])
    expect(isFinished(again)).toBe(false)
  })
})
