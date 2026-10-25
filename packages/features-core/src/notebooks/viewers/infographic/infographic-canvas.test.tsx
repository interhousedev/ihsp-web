import { describe, expect, it } from "bun:test"
import { infographicContent } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../../test-support"
import { InfographicCanvas } from "./infographic-canvas"

allowSlowRenders()

const content = () => screen.getByTestId("infographic-canvas").querySelector<HTMLElement>("[data-ig-content]")

describe("InfographicCanvas", () => {
  it("leaves the content alone by default", () => {
    renderNotebook(<InfographicCanvas content={infographicContent} orientation="portrait" variant="clean" />)

    expect(content()?.style.transform).toBe("")
    expect(content()?.style.width).toBe("")
  })

  it("scales taller content down from the top left and widens it so that it still fills the canvas", () => {
    renderNotebook(
      <InfographicCanvas content={infographicContent} orientation="portrait" variant="clean" contentScale={0.8} />,
    )

    expect(content()?.style.transform).toBe("scale(0.8)")
    expect(content()?.style.transformOrigin).toBe("0 0")
    expect(content()?.style.width).toBe("125%")
  })

  it("gives the blocks of a bento canvas their own tile colours", () => {
    renderNotebook(<InfographicCanvas content={infographicContent} orientation="portrait" variant="bento" />)

    const tiles = Array.from(screen.getByTestId("infographic-canvas").querySelectorAll<HTMLElement>("[data-block]"))
    const tones = new Set(tiles.map((tile) => tile.style.getPropertyValue("--ig-card")))
    expect(tones.size).toBeGreaterThan(1)
  })

  it("keeps one card colour in the other themes", () => {
    renderNotebook(<InfographicCanvas content={infographicContent} orientation="portrait" variant="clean" />)

    const tiles = Array.from(screen.getByTestId("infographic-canvas").querySelectorAll<HTMLElement>("[data-block]"))
    expect(tiles.every((tile) => tile.style.getPropertyValue("--ig-card") === "")).toBe(true)
  })
})
