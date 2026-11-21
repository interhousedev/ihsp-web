import { describe, expect, test } from "bun:test"
import {
  baryToPoint,
  CENTRE,
  clampRating,
  DEFAULT_RATINGS,
  leadingCorners,
  pickAxis,
  pointToBary,
  radarPoint,
  radarToWeights,
  snapTo,
  topTraits,
  triangleToWeights,
  VERTEX,
} from "./weights-model"

const sum = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0)

describe("triangle", () => {
  test("barycentric round trip and outside clamp", () => {
    const b = { profession: 0.2, study: 0.5, social: 0.3 }
    const back = pointToBary(baryToPoint(b))
    expect(back.study).toBeCloseTo(0.5, 6)
    const out = pointToBary({ x: 500, y: -200 })
    expect(out.profession + out.study + out.social).toBeCloseTo(1, 6)
    expect(Object.values(out).every((v) => v >= 0)).toBe(true)
  })

  test("weights sum to one and corners lead their metric", () => {
    expect(sum(triangleToWeights(CENTRE))).toBeCloseTo(1, 6)
    expect(triangleToWeights({ profession: 1, study: 0, social: 0 }).goals).toBeGreaterThan(0.5)
    expect(triangleToWeights({ profession: 0, study: 1, social: 0 }).profile).toBeGreaterThan(0.5)
    expect(triangleToWeights({ profession: 0, study: 0, social: 1 }).traits).toBeGreaterThan(0.5)
  })

  test("snaps to the centre, corners and edges within the radius only", () => {
    const c = baryToPoint(CENTRE)
    expect(snapTo({ x: c.x + 5, y: c.y - 4 }, 12)).toEqual(CENTRE)
    expect(snapTo(VERTEX.study, 12)?.study).toBe(1)
    expect(snapTo({ x: c.x + 40, y: c.y }, 12)).toBeNull()
  })

  test("leading corners", () => {
    expect(leadingCorners(CENTRE)).toEqual([])
    expect(leadingCorners({ profession: 0.8, study: 0.1, social: 0.1 })).toEqual(["profession"])
    expect(leadingCorners({ profession: 0.45, study: 0.45, social: 0.1 })).toHaveLength(2)
  })
})

describe("radar", () => {
  test("weights sum to one and follow the ratings", () => {
    expect(sum(radarToWeights(DEFAULT_RATINGS))).toBeCloseTo(1, 6)
    const rich = radarToWeights({ ...DEFAULT_RATINGS, money: 10 })
    expect(rich.afford).toBeGreaterThan(radarToWeights({ ...DEFAULT_RATINGS, money: 1 }).afford)
  })

  test("rating clamp, top traits and axis picking", () => {
    expect(clampRating(0)).toBe(1)
    expect(clampRating(14.2)).toBe(10)
    expect(topTraits({ ...DEFAULT_RATINGS, money: 9, career: 9 })).toEqual(["money", "career"])
    const p = radarPoint(2, 7, 100, 200, 200)
    expect(pickAxis(p, 100, 200, 200)).toEqual({ index: 2, value: 7 })
  })
})
