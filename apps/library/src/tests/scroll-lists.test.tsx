/** The reading lists tab of My library is a named scroll region, so a keyboard user can reach and scroll it. */
import { describe, expect, test } from "bun:test"
import { MyLibraryPage } from "@ihsp/features-core"
import { allowSlowRenders, renderLibrary } from "@ihsp/features-core/library-test-support"
import { screen } from "@testing-library/react"

allowSlowRenders()

describe("scroll lists", () => {
  test("the reading lists tab is a named, focusable scroll region", async () => {
    renderLibrary(<MyLibraryPage />, { route: "/my/?tab=lists" })

    const region = await screen.findByRole("region", { name: "Lists" })

    expect(region).toHaveAttribute("tabindex", "0")
  })
})
