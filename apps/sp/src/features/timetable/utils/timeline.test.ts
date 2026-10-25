import { describe, expect, it } from "bun:test"
import {
  boxOf,
  clockOf,
  FREE_GAP_MINUTES,
  gapsBetween,
  hourMarks,
  intervalOf,
  laneLayout,
  minutesToPx,
  timelineRange,
} from "./timeline"

/** Minutes of the day at `hh:mm` as the timeline counts them. */
const at = (hh: number, mm: number) => hh * 60 + mm

describe("proportional layout", () => {
  it("turns minutes into pixels at a scale", () => {
    expect(minutesToPx(45, 1.5)).toBe(67.5)
    expect(minutesToPx(0, 1.2)).toBe(0)
  })

  it("places a box by its start from the origin and its length", () => {
    // 09:00 on a timeline that starts at 08:00, 90 minutes long, at 1.5 px a minute.
    expect(boxOf({ startMin: at(9, 0), endMin: at(10, 30) }, at(8, 0), 1.5)).toEqual({ top: 90, height: 135 })
  })

  it("a block twice as long is twice as tall", () => {
    const short = boxOf({ startMin: at(8, 30), endMin: at(9, 0) }, at(8, 0), 1.5)
    const long = boxOf({ startMin: at(8, 30), endMin: at(10, 0) }, at(8, 0), 1.5)
    expect(long.height).toBe(short.height * 3)
  })

  it("the range is whole hours around all the lessons", () => {
    const range = timelineRange([
      { startMin: at(8, 30), endMin: at(9, 15) },
      { startMin: at(13, 15), endMin: at(14, 0) },
    ])
    expect(range).toEqual({ startMin: at(8, 0), endMin: at(14, 0) })
    expect(timelineRange([])).toBeNull()
  })

  it("the range is at least one hour, however short the lesson", () => {
    expect(timelineRange([{ startMin: at(9, 10), endMin: at(9, 20) }])).toEqual({
      startMin: at(9, 0),
      endMin: at(10, 0),
    })
  })

  it("lists the full hours of a range", () => {
    expect(hourMarks({ startMin: at(8, 0), endMin: at(11, 0) })).toEqual([at(8, 0), at(9, 0), at(10, 0), at(11, 0)])
  })

  it("formats minutes of the day as a clock", () => {
    expect(clockOf(at(8, 5))).toBe("08:05")
    expect(clockOf(at(14, 0))).toBe("14:00")
  })

  it("reads the lesson times on the Tashkent clock", () => {
    // 08:30 Tashkent is 03:30 UTC.
    expect(intervalOf({ starts_at: "2026-10-07T03:30:00Z", ends_at: "2026-10-07T04:15:00Z" })).toEqual({
      startMin: at(8, 30),
      endMin: at(9, 15),
    })
  })
})

describe("gaps between lessons", () => {
  it("a short gap is a break, a gap of 30 minutes or more is free", () => {
    expect(FREE_GAP_MINUTES).toBe(30)
    const gaps = gapsBetween([
      { startMin: at(8, 30), endMin: at(9, 15) },
      { startMin: at(9, 25), endMin: at(10, 10) }, // 10 minutes: break
      { startMin: at(10, 40), endMin: at(11, 25) }, // 30 minutes: free
    ])
    expect(gaps).toEqual([
      { startMin: at(9, 15), endMin: at(9, 25), minutes: 10, kind: "break" },
      { startMin: at(10, 10), endMin: at(10, 40), minutes: 30, kind: "free" },
    ])
  })

  it("overlapping lessons are one block, so no gap is inside them", () => {
    const gaps = gapsBetween([
      { startMin: at(9, 0), endMin: at(10, 0) },
      { startMin: at(9, 30), endMin: at(10, 30) },
      { startMin: at(10, 45), endMin: at(11, 0) },
    ])
    expect(gaps).toEqual([{ startMin: at(10, 30), endMin: at(10, 45), minutes: 15, kind: "break" }])
  })

  it("time before the first and after the last lesson is not a gap", () => {
    expect(gapsBetween([{ startMin: at(9, 0), endMin: at(10, 0) }])).toEqual([])
    expect(gapsBetween([])).toEqual([])
  })

  it("lessons that touch leave no gap", () => {
    expect(
      gapsBetween([
        { startMin: at(9, 0), endMin: at(10, 0) },
        { startMin: at(10, 0), endMin: at(11, 0) },
      ]),
    ).toEqual([])
  })
})

describe("lanes for overlapping lessons", () => {
  it("lessons that do not overlap take the full width", () => {
    const slots = laneLayout([
      { id: "a", startMin: at(8, 30), endMin: at(9, 15) },
      { id: "b", startMin: at(9, 25), endMin: at(10, 10) },
    ])
    expect(slots.map((slot) => [slot.lane, slot.lanes])).toEqual([
      [0, 1],
      [0, 1],
    ])
  })

  it("two lessons at the same time share the width, in input order", () => {
    const slots = laneLayout([
      { id: "a", startMin: at(10, 20), endMin: at(11, 5) },
      { id: "b", startMin: at(10, 20), endMin: at(11, 5) },
    ])
    expect(slots.map((slot) => [slot.id, slot.lane, slot.lanes])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
    ])
  })

  it("a lesson that starts when another ends reuses its lane", () => {
    const slots = laneLayout([
      { id: "long", startMin: at(9, 0), endMin: at(11, 0) },
      { id: "short", startMin: at(9, 0), endMin: at(10, 0) },
      { id: "after", startMin: at(10, 0), endMin: at(10, 45) },
    ])
    // Sorted by start, then end: "short" takes lane 0, "long" lane 1, and "after" starts as "short" ends.
    expect(slots.map((slot) => [slot.id, slot.lane, slot.lanes])).toEqual([
      ["long", 1, 2],
      ["short", 0, 2],
      ["after", 0, 2],
    ])
  })
})
