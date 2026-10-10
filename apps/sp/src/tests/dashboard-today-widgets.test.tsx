/** The Today sections as widgets: each kind at each size, the default layout, the merge, the catalogue groups. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, dashboardLayout, server } from "@ihsp/test-utils"
import type { DashboardWidget, DashboardWidgetKind } from "@ihsp/api"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { Dashboard } from "../features/today/dashboard/dashboard"
import {
  LAYOUT_MARK,
  RETIRED_KINDS,
  TODAY_KINDS,
  WIDGET_GROUPS,
  WIDGET_KINDS,
  WIDGET_SIZES,
  withTodayWidgets,
} from "../features/today/dashboard/model"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()
beforeEach(freezeTime)
afterEach(unfreezeTime)

function widget(kind: DashboardWidgetKind, size: string): DashboardWidget {
  return {
    id: `0000000d-0000-4000-8000-${String(Math.abs(hash(kind + size)))
      .padStart(12, "0")
      .slice(0, 12)}`,
    kind,
    size: size as DashboardWidget["size"],
    x: 0,
    y: 0,
    color: null,
    config: { [LAYOUT_MARK.key]: LAYOUT_MARK.value },
    text_color: null,
  }
}

function hash(value: string): number {
  let h = 7
  for (const char of value) h = (h * 31 + char.charCodeAt(0)) % 999_999_999
  return h
}

function layoutOf(...widgets: DashboardWidget[]) {
  server.use(http.get(apiUrl("/v1/me/dashboard"), () => HttpResponse.json({ version: 5, widgets })))
}

const EXPECTED_TEXT: Record<string, RegExp> = {
  next_lesson: /in 8 min/,
  today_lessons: /\d\d:\d\d/,
  semester_summary: /4\.10/,
  announcements: /./,
  new_marks: /./,
  alerts: /./,
  upcoming_controls: /Midterm 1/,
  get_started: /./,
}

describe("Today widgets at every size", () => {
  for (const kind of TODAY_KINDS) {
    for (const size of WIDGET_SIZES[kind]) {
      test(`${kind} renders at ${size}`, async () => {
        layoutOf(widget(kind, size))
        renderSp(<Dashboard />)
        const found = await waitForTile(kind)
        expect(found).toHaveAttribute("data-widget-size", size)
        const texts = await within(found).findAllByText(EXPECTED_TEXT[kind] ?? /./)
        expect(texts.length).toBeGreaterThan(0)
      })
    }
  }
})

async function waitForTile(kind: string): Promise<HTMLElement> {
  for (let i = 0; i < 50; i++) {
    const found = document.querySelector<HTMLElement>(`[data-widget-kind="${kind}"]`)
    if (found) return found
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error(`no ${kind} tile`)
}

describe("needs attention", () => {
  test("a student does not see the EMIS sync failure, the other alerts stay", async () => {
    server.use(
      http.get(apiUrl("/v1/me/alerts"), () =>
        HttpResponse.json([
          { kind: "sync_failed", params: {}, action_url: "/grades/" },
          { kind: "no_subgroup", params: {}, action_url: "/profile/" },
        ]),
      ),
    )
    layoutOf(widget("alerts", "2x1"))
    renderSp(<Dashboard />)

    const tile = await waitForTile("alerts")
    await within(tile).findByText("Subgroup not set")
    expect(within(tile).queryByText("EMIS sync failed")).toBeNull()
  })
})

describe("the Today layout", () => {
  test("a saved layout from before gets the new widgets once", async () => {
    renderSp(<Dashboard />)

    await waitForTile("next_lesson")
    for (const kind of TODAY_KINDS) {
      expect(document.querySelectorAll(`[data-widget-kind="${kind}"]`)).toHaveLength(1)
    }
    expect(document.querySelectorAll('[data-widget-kind="homework"]')).toHaveLength(1)
  })

  test("the merge appends only the missing kinds and is idempotent", () => {
    const merged = withTodayWidgets(dashboardLayout.widgets)
    const kinds = merged.map((w) => w.kind)
    expect(new Set(kinds).size).toBe(kinds.length)
    expect(TODAY_KINDS.every((kind) => kinds.includes(kind))).toBe(true)
    expect(withTodayWidgets(merged)).toEqual(merged)

    const withOne = withTodayWidgets([...dashboardLayout.widgets, { ...widget("alerts", "2x1"), config: {} }])
    expect(withOne.filter((w) => w.kind === "alerts")).toHaveLength(1)
  })

  test("a marked layout where the student removed widgets is left alone; an empty one stays empty", () => {
    const marked = [widget("homework", "1x1")]
    expect(withTodayWidgets(marked)).toEqual(marked)
    expect(withTodayWidgets([])).toEqual([])
  })

  test("every kind has sizes, a catalogue group (the retired ones excepted) and no kind is in two groups", () => {
    const grouped = WIDGET_GROUPS.flatMap((g) => g.kinds)
    expect(grouped.toSorted()).toEqual(WIDGET_KINDS.filter((kind) => !RETIRED_KINDS.includes(kind)).toSorted())
    expect(grouped.some((kind) => RETIRED_KINDS.includes(kind))).toBe(false)
    expect(new Set(grouped).size).toBe(grouped.length)
    expect(WIDGET_GROUPS.map((g) => g.id)).toEqual(["study", "control", "news", "tools"])
  })

  test("the catalogue shows the groups", async () => {
    const { user } = renderSp(<Dashboard />)
    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Add widget" }))

    const catalogue = screen.getByRole("list", { name: "Widget catalogue" })
    for (const name of ["Study", "Control", "News", "Tools"])
      expect(within(catalogue).getByRole("heading", { name })).toBeInTheDocument()
  })

  test("the grid is one column on a phone and 4 on a desktop, with rows as tall as their content", async () => {
    renderSp(<Dashboard />)
    const grid = await screen.findByTestId("dashboard-grid")
    expect(grid.className).toContain("grid-cols-1")
    expect(grid.className).toContain("md:grid-cols-4")
    expect(grid.className).toContain("auto-rows-min")
    expect(grid.className).toContain("items-start")
  })

  test("a retired kind left in a saved layout is not shown, and an edit drops it", async () => {
    const bodies: { widgets: { kind: DashboardWidgetKind }[] }[] = []
    server.use(
      http.put(apiUrl("/v1/me/dashboard"), async ({ request }) => {
        const body = (await request.json()) as { version: number; widgets: { kind: DashboardWidgetKind }[] }
        bodies.push(body)
        return HttpResponse.json({ version: body.version + 1, widgets: body.widgets })
      }),
    )
    const { user } = renderSp(<Dashboard />)
    await waitForTile("next_lesson")
    for (const kind of RETIRED_KINDS) expect(document.querySelector(`[data-widget-kind="${kind}"]`)).toBeNull()

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.widgets.some((w) => RETIRED_KINDS.includes(w.kind))).toBe(false)
  })
})
