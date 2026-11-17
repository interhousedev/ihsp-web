/** The chooser: filters become query params, a hidden estimate stays hidden, adding to the list, and no-data filters. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { deadlineText } from "../features/chooser/components/institution-detail"
import { filterStudyGroups } from "../features/chooser/components/study-field-select"
import { StrengthenCard } from "../features/chooser/components/chances-view"
import { AddToListButton } from "../features/chooser/components/add-to-list-button"
import { EstimateView } from "../features/chooser/components/estimate-view"
import { SearchView } from "../features/chooser/components/search-view"
import { estimate, institution, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

describe("chooser search", () => {
  it("sends the URL filters as query params", async () => {
    const { catalogRequests } = mockChooser({ items: [institution()] })
    renderAdmissionApp(<SearchView />, {
      route: "/chooser/search/?country=Testland&setting=urban&scholarships=true",
    })
    await screen.findByText("Uni One")
    const filtered = catalogRequests.find((url) => url.searchParams.get("country") === "Testland")
    expect(filtered).toBeDefined()
    expect(filtered?.searchParams.get("setting")).toBe("urban")
    expect(filtered?.searchParams.get("scholarships")).toBe("true")
    expect(filtered?.searchParams.get("cursor")).toBe("0")
    expect(filtered?.searchParams.has("limit")).toBe(true)
  })

  it("shows removable chips for active filters and a clear-all button", async () => {
    mockChooser({ items: [institution()] })
    renderAdmissionApp(<SearchView />, { route: "/chooser/search/?country=Testland&setting=urban" })
    await screen.findByText("Uni One")
    const list = await screen.findByRole("list", { name: "Active filters" })
    expect(list).toBeDefined()
    expect(screen.getByRole("button", { name: "Clear all" })).toBeDefined()
    expect(screen.getAllByRole("button", { name: /Remove filter/ }).length).toBeGreaterThanOrEqual(2)
  })

  it("labels the facet filters", async () => {
    mockChooser({ items: [institution()] })
    renderAdmissionApp(<SearchView />, { route: "/chooser/search/" })
    await screen.findByText("Uni One")
    expect(await screen.findByLabelText("Setting")).toBeDefined()
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

describe("detail helpers", () => {
  it("writes deadlines as human text", () => {
    const text = deadlineText(
      { plan: "ED", date: "2026-11-02", notify_by: null, cycle: "2026-27", label_short: "Early Decision · Nov 2" },
      "en",
    )
    expect(text).toBe("Early Decision · Nov 2")
  })
})

describe("study field select", () => {
  it("filters groups by search text", () => {
    const groups = [
      {
        id: "g1",
        label: "Sciences",
        items: [
          { id: "physics", label: "Physics" },
          { id: "bio", label: "Biology" },
        ],
      },
    ]
    expect(filterStudyGroups(groups, "phys")[0]?.items.map((item) => item.id)).toEqual(["physics"])
    expect(filterStudyGroups(groups, "zzz")).toEqual([])
  })
})

describe("strengthen card", () => {
  it("shows AI academic and activity sections and the questions", async () => {
    mockChooser()
    server.use(
      http.get(apiUrl("/v1/admission/uni-chats/i1/suggestions"), () =>
        HttpResponse.json({
          questions: ["What are the deadlines?"],
          academic: [{ title: "Raise math", detail: "Take calculus" }],
          activities: [{ title: "Lead a club", detail: "Run it for a year" }],
        }),
      ),
    )
    renderAdmissionApp(<StrengthenCard factors={[]} institutionId="i1" />)
    expect(await screen.findByText("Raise math")).toBeDefined()
    expect(screen.getByText("Lead a club")).toBeDefined()
    expect(screen.getByText("What are the deadlines?")).toBeDefined()
    expect(screen.getByTestId("ai-academic")).toBeDefined()
  })
})
