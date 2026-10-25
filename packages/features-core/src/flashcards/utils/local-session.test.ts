import { describe, expect, it } from "bun:test"
import { createLocalSession, localAnswer, localCounts, localNext } from "./local-session"

const NOW = Date.UTC(2026, 9, 7, 5, 0)
const MINUTE = 60_000
const cards = [
  { id: "1", front: "A", back: "a" },
  { id: "2", front: "B", back: "b" },
  { id: "3", front: "C", back: "c" },
]

describe("a local study session", () => {
  it("starts with every card new, in order", () => {
    const session = createLocalSession(cards)

    expect(localCounts(session)).toEqual({ new: 3, learning: 0, review: 0 })
    expect(localNext(session, NOW)?.card.id).toBe("1")
    expect(localNext(session, NOW)?.intervals.medium).toBe("10m")
  })

  it("moves an answered card to learning and offers the next new card", () => {
    const session = localAnswer(createLocalSession(cards), "1", "medium", NOW)

    expect(localCounts(session)).toEqual({ new: 2, learning: 1, review: 0 })
    expect(localNext(session, NOW)?.card.id).toBe("2")
    expect(session.reviewed).toBe(1)
  })

  it("brings a learning card back once it is due, before the new ones", () => {
    const session = localAnswer(createLocalSession(cards), "1", "again", NOW)

    expect(localNext(session, NOW + MINUTE)?.card.id).toBe("1")
    expect(localNext(session, NOW + MINUTE)?.state).toBe("learning")
  })

  it("learns ahead: when only learning cards are left the soonest one is offered", () => {
    let session = createLocalSession(cards)
    for (const id of ["1", "2", "3"]) session = localAnswer(session, id, "again", NOW)

    expect(localNext(session, NOW)?.card.id).toBe("1")
  })

  it("drops a card that graduates and ends when none is left", () => {
    let session = createLocalSession(cards)
    for (const id of ["1", "2", "3"]) session = localAnswer(session, id, "easy", NOW)

    expect(localCounts(session)).toEqual({ new: 0, learning: 0, review: 0 })
    expect(localNext(session, NOW)).toBeNull()
    expect(session.reviewed).toBe(3)
  })

  it("ignores an unknown card", () => {
    const session = createLocalSession(cards)

    expect(localAnswer(session, "nope", "easy", NOW)).toBe(session)
  })
})
