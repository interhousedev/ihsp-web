import { describe, expect, it } from "bun:test"
import type { Slide } from "@ihsp/api"
import { render, screen } from "@testing-library/react"
import { SlideView } from "./slide-view"

const base = { id: "s2", title: "Agenda", notes: "", refs: [] }

describe("SlideView", () => {
  it("draws the agenda layout as a numbered list", () => {
    const slide: Slide = { ...base, layout: "agenda", bullets: ["Light reactions", "Calvin cycle"] }
    render(<SlideView slide={slide} />)

    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["1Light reactions", "2Calvin cycle"])
  })

  it("does not crash on a layout this build does not know", () => {
    const slide = { ...base, layout: "brand_new", bullets: ["One"] } as unknown as Slide
    render(<SlideView slide={slide} />)

    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument()
  })
})
