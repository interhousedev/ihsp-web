import { describe, expect, it } from "bun:test"
import { screen } from "@testing-library/react"
import { renderLibrary } from "../test-support"
import { CoverImage } from "./cover-image"
import { GeneratedCover, coverHue } from "./generated-cover"

describe("coverHue", () => {
  it("is the same for the same title and within a colour wheel", () => {
    expect(coverHue("Otkan kunlar")).toBe(coverHue("Otkan kunlar"))
    for (const title of ["Otkan kunlar", "Alisher Navoiy", "Ҳамса", ""]) {
      expect(coverHue(title)).toBeGreaterThanOrEqual(0)
      expect(coverHue(title)).toBeLessThan(360)
    }
    expect(coverHue("Otkan kunlar")).not.toBe(coverHue("Alisher Navoiy"))
  })
})

describe("GeneratedCover", () => {
  it("carries the title and author for CSS, on a colour taken from the title", () => {
    renderLibrary(<GeneratedCover title="Otkan kunlar" author="Abdulla Qodiriy" />)

    const cover = document.querySelector<HTMLElement>('[data-title="Otkan kunlar"]')
    expect(cover).not.toBeNull()
    expect(cover?.getAttribute("data-author")).toBe("Abdulla Qodiriy")
    expect(cover?.getAttribute("aria-hidden")).toBe("true")
    expect(cover?.style.backgroundImage).toContain(`hsl(${coverHue("Otkan kunlar")} `)
    expect(cover?.textContent).toBe("")
  })
})

describe("CoverImage fallback", () => {
  it("draws a generated cover for a book without an image", () => {
    renderLibrary(<CoverImage src={null} title="Otkan kunlar" author="Abdulla Qodiriy" />)

    expect(document.querySelector('[data-title="Otkan kunlar"]')).not.toBeNull()
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("keeps the labelled placeholder when there is no title", () => {
    renderLibrary(<CoverImage src={null} />)

    expect(screen.getByRole("img", { name: "No cover" })).toBeTruthy()
  })
})
