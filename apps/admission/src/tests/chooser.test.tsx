/** The chooser: filters become query params, a hidden estimate stays hidden, adding to the list, and no-data filters. */
import { describe, expect, it } from "bun:test"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { AddToListButton } from "../features/chooser/components/add-to-list-button"
import { EstimateView } from "../features/chooser/components/estimate-view"
import { SearchView } from "../features/chooser/components/search-view"
import { estimate, institution, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

describe("chooser search", () => {
  it("sends the URL filters as query params", async () => {
    const { catalogRequests } = mockChooser({ items: [institution({ facts: { crime_index: { value: 2 } as never } })] })
    renderAdmissionApp(<SearchView />, {
      route: "/chooser/search/?country=Testland&max_crime_index=3&scholarships=true",
    })
    await screen.findByText("Uni One")
    const filtered = catalogRequests.find((url) => url.searchParams.get("country") === "Testland")
    expect(filtered).toBeDefined()
    expect(filtered?.searchParams.get("max_crime_index")).toBe("3")
    expect(filtered?.searchParams.get("scholarships")).toBe("true")
    expect(filtered?.searchParams.get("cursor")).toBe("0")
    expect(filtered?.searchParams.has("limit")).toBe(true)
  })

  it("explains missing data instead of showing no results", async () => {
    mockChooser({ items: [] })
    renderAdmissionApp(<SearchView />, { route: "/chooser/search/?max_crime_index=3" })
    await screen.findByText("No data for this filter yet")
    expect(screen.queryByText("Nothing matches these filters.")).toBeNull()
  })
})

describe("estimate", () => {
  it("shows only the label while the range is hidden", () => {
    renderAdmissionApp(<EstimateView estimate={estimate({ low: 10, high: 20, range_visible: false })} />)
    expect(screen.getByText("Target")).toBeDefined()
    expect(screen.getByText("Personal estimates are not available yet.")).toBeDefined()
    expect(screen.queryByText(/10.20/)).toBeNull()
  })

  it("shows the range with a not-a-prediction note when the API allows it", () => {
    renderAdmissionApp(<EstimateView estimate={estimate({ low: 10, high: 20, range_visible: true })} />)
    expect(screen.getByText(/10.20/)).toBeDefined()
    expect(screen.getByText("Not a prediction.")).toBeDefined()
  })
})

describe("my list", () => {
  it("posts the institution when added", async () => {
    const { listPosts } = mockChooser()
    renderAdmissionApp(<AddToListButton institutionId="i1" />)
    const button = await screen.findByRole("button", { name: "Add to my list" })
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(button)
    await waitFor(() => expect(listPosts).toEqual([{ institution_id: "i1" }]))
  })
})
