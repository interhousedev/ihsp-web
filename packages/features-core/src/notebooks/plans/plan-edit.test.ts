import { describe, expect, it } from "bun:test"
import type { PlanSlide } from "@ihsp/api"
import { addBullet, editBullet, editTitle, moveSlide, removeBullet, removeSlide, trimTo } from "./plan-edit"

const slides: PlanSlide[] = [
  { title: "A", bullets: ["a1", "a2"] },
  { title: "B", bullets: ["b1"] },
  { title: "C", bullets: [] },
]

describe("PLAN outline editing", () => {
  it("moves a slide up and down and ignores moves past the ends", () => {
    expect(moveSlide(slides, 2, -1).map((s) => s.title)).toEqual(["A", "C", "B"])
    expect(moveSlide(slides, 0, 1).map((s) => s.title)).toEqual(["B", "A", "C"])
    expect(moveSlide(slides, 0, -1)).toBe(slides)
    expect(moveSlide(slides, 2, 1)).toBe(slides)
  })

  it("deletes a slide and edits titles and bullets without touching the others", () => {
    expect(removeSlide(slides, 1).map((s) => s.title)).toEqual(["A", "C"])
    expect(editTitle(slides, 0, "Intro")[0]?.title).toBe("Intro")
    expect(editBullet(slides, 0, 1, "x")[0]?.bullets).toEqual(["a1", "x"])
    expect(addBullet(slides, 2)[2]?.bullets).toEqual([""])
    expect(removeBullet(slides, 0, 0)[0]?.bullets).toEqual(["a2"])
    expect(slides[0]?.bullets).toEqual(["a1", "a2"])
  })

  it("trims a plan to the limit, keeping the last (summary) slide", () => {
    const many = Array.from({ length: 6 }, (_, n) => ({ title: `S${n}`, bullets: [] }))
    expect(trimTo(many, 4).map((s) => s.title)).toEqual(["S0", "S1", "S2", "S5"])
    expect(trimTo(slides, 5)).toBe(slides)
  })
})
