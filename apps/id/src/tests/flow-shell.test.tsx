/** Split layout of the auth pages: the form beside a campus photo with the Latin motto, hidden below `lg`. */
import { describe, expect, test } from "bun:test"
import { screen } from "@testing-library/react"
import { FlowShell } from "../features/shared/components/flow-shell"
import { allowSlowTests, renderId } from "./helpers"

allowSlowTests()
describe("flow shell", () => {
  test("renders the form and the campus panel with the motto and a described photo", async () => {
    renderId(<FlowShell>form body</FlowShell>)

    expect(await screen.findByText("form body")).toBeInTheDocument()
    expect(screen.getByText("Non scholae sed vitae discimus")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /International House Tashkent/, hidden: true })).toHaveAttribute(
      "src",
      "/campus.webp",
    )
    expect(screen.getByTestId("campus-panel")).toHaveClass("hidden", "lg:block")
  })
})
