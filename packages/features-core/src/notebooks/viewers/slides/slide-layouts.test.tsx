import { describe, expect, it } from "bun:test"
import type { Slide } from "@ihsp/api"
import { fireEvent, screen } from "@testing-library/react"
import { renderNotebook } from "../../test-support"
import { SlideEditor } from "./slide-editor"
import { SlideView } from "./slide-view"

const base = { id: "x", title: "Heading", notes: "", refs: [] }
const image = {
  url: "https://example.org/leaf.jpg",
  alt: "A leaf",
  attribution: "Jane Doe",
  source_url: "https://example.org/leaf",
  license: "CC BY 4.0",
}

function draw(slide: Partial<Slide> & Pick<Slide, "layout">) {
  return renderNotebook(<SlideView slide={{ ...base, ...slide }} />)
}

describe("SlideView new layouts", () => {
  it("draws stats as values with captions", () => {
    draw({
      layout: "stats",
      stats: [
        { value: "6CO₂", label: "Inputs" },
        { value: "36%", label: "Yield" },
      ],
    })
    expect(screen.getByText("36%")).toBeInTheDocument()
    expect(screen.getByText("Inputs")).toBeInTheDocument()
  })

  it("draws a timeline in order", () => {
    draw({
      layout: "timeline",
      timeline: [
        { when: "1771", label: "Priestley" },
        { when: "1779", label: "Ingenhousz" },
      ],
    })
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["1771Priestley", "1779Ingenhousz"])
  })

  it("draws comparison and the singular two_column as two columns", () => {
    const columns = {
      left: { heading: "Light", bullets: ["a"] },
      right: { heading: "Dark", bullets: ["b"] },
    }
    draw({ layout: "comparison", ...columns })
    expect(screen.getByRole("heading", { name: "Light" })).toBeInTheDocument()
    draw({ layout: "two_column", ...columns })
    expect(screen.getAllByRole("heading", { name: "Dark" })).toHaveLength(2)
  })

  it("draws an image beside the text with a credit link to the source", () => {
    draw({ layout: "image_left", bullets: ["Green"], image })
    expect(screen.getByRole("img", { name: "A leaf" })).toHaveAttribute("src", image.url)
    const link = screen.getByRole("link", { name: /Jane Doe/ })
    expect(link).toHaveAttribute("href", image.source_url)
    expect(link).toHaveTextContent("CC BY 4.0")
    expect(screen.getByText("Green")).toBeInTheDocument()
  })

  it("draws image_right and full_image, and never links a non-web source", () => {
    draw({ layout: "image_right", bullets: ["Right"], image: { ...image, source_url: "javascript:alert(1)" } })
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    draw({ layout: "full_image", subtitle: "Sub", image })
    expect(screen.getByText("Sub")).toBeInTheDocument()
  })
})

describe("SlideEditor new layouts", () => {
  it("keeps the image and saves a changed stat value", () => {
    let saved: Slide = { ...base, layout: "stats", stats: [{ value: "36%", label: "Yield" }], image }
    const view = (slide: Slide) => (
      <SlideEditor
        slide={slide}
        number={1}
        onPatch={(patch) => {
          saved = { ...saved, ...patch }
        }}
      />
    )
    renderNotebook(view(saved))
    fireEvent.change(screen.getByDisplayValue("36%"), { target: { value: "40%" } })
    expect(saved.stats).toEqual([{ value: "40%", label: "Yield" }])
    expect(saved.image).toEqual(image)
  })
})
