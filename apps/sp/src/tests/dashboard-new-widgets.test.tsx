/** The library and recent-notebooks widgets: empty state, and the full-width 4x1 size. */
import { describe, expect, test } from "bun:test"
import { apiUrl, dashboardLayout, server } from "@ihsp/test-utils"
import type { DashboardWidget, DashboardWidgetKind } from "@ihsp/api"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { Dashboard } from "../features/today/dashboard/dashboard"
import { LAYOUT_MARK, WIDGET_SIZES } from "../features/today/dashboard/model"
import { configureTests, renderSp } from "./helpers"

configureTests()

function tile(kind: DashboardWidgetKind, size: DashboardWidget["size"]): DashboardWidget {
  return {
    id: "0000000d-0000-4000-8000-0000000000aa",
    kind,
    size,
    x: 0,
    y: 0,
    color: null,
    config: { [LAYOUT_MARK.key]: LAYOUT_MARK.value },
    text_color: null,
  }
}

function show(widget: DashboardWidget) {
  server.use(http.get(apiUrl("/v1/me/dashboard"), () => HttpResponse.json({ ...dashboardLayout, widgets: [widget] })))
}

const EMPTY = { items: [], next_cursor: null }

describe("new dashboard widgets", () => {
  test("library_loans shows its empty state", async () => {
    server.use(http.get(apiUrl("/v1/me/library/shelf"), () => HttpResponse.json(EMPTY)))
    show(tile("library_loans", "2x1"))
    renderSp(<Dashboard />)
    const card = await screen.findByTestId("card-empty")
    expect(within(card).getByText("You are not reading any book.")).toBeInTheDocument()
  })

  test("notebook_recents shows its empty state", async () => {
    server.use(http.get(apiUrl("/v1/notebooks"), () => HttpResponse.json(EMPTY)))
    show(tile("notebook_recents", "2x2"))
    renderSp(<Dashboard />)
    const card = await screen.findByTestId("card-empty")
    expect(within(card).getByText("No notebooks yet.")).toBeInTheDocument()
  })

  test("strip widgets allow 4x1", () => {
    for (const kind of ["announcements", "alerts", "today_lessons"] as const) {
      expect(WIDGET_SIZES[kind]).toContain("4x1")
    }
  })
})
