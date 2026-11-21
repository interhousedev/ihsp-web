import { describe, expect, test } from "bun:test"
import {
  clampRating,
  DEFAULT_RATINGS,
  pickAxis,
  radarPoint,
  ratingsToWeights,
  sameRatings,
  topTraits,
  TRAITS,
} from "./weights-model"

const sum = (w: Record<string, number>) => Object.values(w).reduce((a, b) => a + b, 0)

describe("radar", () => {
  test("eight axes, price and salary separate", () => {
    expect(TRAITS).toHaveLength(8)
    expect(TRAITS).toContain("price")
    expect(TRAITS).toContain("salary")
  })

  test("all-5 ratings equal the server default 0.25/0.30/0.30/0.15", () => {
    const w = ratingsToWeights(DEFAULT_RATINGS)
    expect(sum(w)).toBeCloseTo(1, 6)
    expect(w.afford).toBeCloseTo(0.25, 6)
    expect(w.goals).toBeCloseTo(0.3, 6)
    expect(w.profile).toBeCloseTo(0.3, 6)
    expect(w.traits).toBeCloseTo(0.15, 6)
  })

  test("price raises afford only; salary raises goals only", () => {
    const base = ratingsToWeights(DEFAULT_RATINGS)
    const price = ratingsToWeights({ ...DEFAULT_RATINGS, price: 10 })
    const salary = ratingsToWeights({ ...DEFAULT_RATINGS, salary: 10 })
    expect(price.afford).toBeGreaterThan(base.afford)
    expect(salary.goals).toBeGreaterThan(base.goals)
    expect(salary.afford).toBeLessThan(base.afford)
  })

  test("rating clamp, top traits and axis picking", () => {
    expect(clampRating(0)).toBe(1)
    expect(clampRating(14.2)).toBe(10)
    expect(topTraits(DEFAULT_RATINGS)).toEqual([])
    expect(topTraits({ ...DEFAULT_RATINGS, price: 9, salary: 9 })).toEqual(["price", "salary"])
    const p = radarPoint(3, 7, 100, 200, 200)
    expect(pickAxis(p, 100, 200, 200)).toEqual({ index: 3, value: 7 })
    expect(sameRatings(DEFAULT_RATINGS, { ...DEFAULT_RATINGS })).toBe(true)
  })
})
