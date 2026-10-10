import { describe, expect, it } from "bun:test"
import { libStats, setLibraryActor, userMe } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import axe from "axe-core"
import { http, HttpResponse } from "msw"
import { server, apiUrl } from "@ihsp/test-utils"
import { allowSlowRenders, renderLibrary } from "../../test-support"
import { StatsPage } from "./stats-page"

allowSlowRenders()

function renderStats() {
  setLibraryActor("librarian")
  return renderLibrary(<StatsPage />, {
    route: "/manage/stats/",
    session: { user: { ...userMe, roles: ["student", "librarian"] } },
  })
}

describe("StatsPage", () => {
  it("shows the use, the queue, uploads by day, searches without results, top items and the gaps", async () => {
    renderStats()

    const queue = await screen.findByRole("region", { name: "Review queue" })
    expect(within(queue).getByText("Waiting")).toBeInTheDocument()
    expect(within(queue).getByText(/52/)).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Uploads by day" }).querySelectorAll("li")).toHaveLength(
      libStats.uploads_by_day.length,
    )
    const searches = screen.getByRole("list", { name: "Searches without results" })
    expect(within(searches).getByText("organik kimyo")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list", { name: "Most opened items" })).getByRole("link", {
        name: "Physics 10: Mechanics",
      }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Items by status" })).getByText("Published")).toBeInTheDocument()
    expect(
      within(screen.getByRole("list", { name: "Open reports by reason" })).getByText("Copyright"),
    ).toBeInTheDocument()
    const gaps = screen.getByRole("list", { name: "Subjects without materials" })
    expect(within(gaps).getByRole("link", { name: "History" }).getAttribute("href")).toContain("subject=")
  })

  it("warns when the oldest item has waited longer than two school days", async () => {
    renderStats()

    expect(await screen.findByText(/waited over 2 school days/)).toBeInTheDocument()
  })

  it("shows no warning for a short queue", async () => {
    server.use(
      http.get(apiUrl("/v1/manage/library/stats"), () =>
        HttpResponse.json({ ...libStats, queue: { length: 1, oldest_age_hours: 5, average_hours: 4 } }),
      ),
    )
    renderStats()

    expect(await screen.findByText("Goal: a decision within 2 school days.")).toBeInTheDocument()
    expect(screen.queryByText(/waited over 2 school days/)).not.toBeInTheDocument()
  })

  it("shows empty states for empty lists", async () => {
    server.use(
      http.get(apiUrl("/v1/manage/library/stats"), () =>
        HttpResponse.json({
          ...libStats,
          uploads_by_day: [],
          searches_without_results: [],
          top_items: [],
          subjects_without_materials: [],
          reports_by_reason: {},
        }),
      ),
    )
    renderStats()

    expect(await screen.findByText("No uploads in this period.")).toBeInTheDocument()
    expect(screen.getByText("Every search found something.")).toBeInTheDocument()
    expect(screen.getByText("Every subject has materials.")).toBeInTheDocument()
  })

  it("refuses a range whose start is after its end", async () => {
    const { user } = renderStats()
    await screen.findByRole("region", { name: "Review queue" })

    const from = screen.getByLabelText("From")
    await user.clear(from)
    await user.type(from, "2999-01-01")

    expect(await screen.findByText("The start date must not be after the end date.")).toBeInTheDocument()
  })

  it("has no axe violations", async () => {
    const { container } = renderStats()
    await screen.findByRole("region", { name: "Review queue" })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })

    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
