import { describe, expect, it } from "bun:test"
import { slidesContent } from "@ihsp/test-utils"
import { cleanSlides, moveItem, patchSlide, removeSlide, sameSlides, slideName, textTier } from "./slide-deck-state"

const slides = slidesContent.slides

describe("slide deck state", () => {
  it("moves an item without changing the original list", () => {
    const original = ["a", "b", "c"]

    expect(moveItem(original, 0, 2)).toEqual(["b", "c", "a"])
    expect(moveItem(original, 2, 1)).toEqual(["a", "c", "b"])
    expect(original).toEqual(["a", "b", "c"])
  })

  it("ignores moves outside the list", () => {
    expect(moveItem(["a", "b"], 0, 5)).toEqual(["a", "b"])
    expect(moveItem(["a", "b"], -1, 0)).toEqual(["a", "b"])
  })

  it("patches and removes a slide by id", () => {
    const patched = patchSlide(slides, "s2", { title: "New" })
    expect(patched.find((slide) => slide.id === "s2")?.title).toBe("New")
    expect(patched).toHaveLength(slides.length)
    expect(removeSlide(slides, "s2").map((slide) => slide.id)).not.toContain("s2")
  })

  it("drops blank bullets when saving and keeps the rest as typed", () => {
    const dirty = patchSlide(slides, "s3", {
      left: { heading: "Light reactions", bullets: ["Thylakoids", "  ", ""] },
    })

    const cleaned = cleanSlides(dirty)

    expect(cleaned.find((slide) => slide.id === "s3")?.left?.bullets).toEqual(["Thylakoids"])
    expect(cleaned.find((slide) => slide.id === "s2")).toEqual(slides.find((slide) => slide.id === "s2"))
  })

  it("compares decks by content", () => {
    expect(sameSlides(slides, structuredClone(slides))).toBe(true)
    expect(sameSlides(slides, patchSlide(slides, "s1", { title: "x" }))).toBe(false)
  })

  it("names a slide by its title or the start of its quote", () => {
    expect(slideName(slides[1]!)).toBe("Two stages")
    expect(slideName(slides[3]!)).toBe("Stage two does not need light directly.")
    expect(slideName({ ...slides[3]!, quote: { text: "x".repeat(80), attribution: null } })).toHaveLength(48)
  })

  it("uses a smaller type tier for dense slides", () => {
    expect(textTier(slides[1]!)).toBe(0)
    expect(textTier({ ...slides[1]!, body: "x".repeat(300) })).toBe(1)
    expect(textTier({ ...slides[1]!, body: "x".repeat(600) })).toBe(2)
  })
})
