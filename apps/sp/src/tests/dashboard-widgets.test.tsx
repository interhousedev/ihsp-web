/** The Today dashboard: add from the catalogue, resize, colour with readable text, save with the version. */
import { describe, expect, test } from "bun:test"
import { apiUrl, dashboardLayout, problem, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RETIRED_KINDS, TODAY_KINDS } from "../features/today/dashboard/model"
import { Dashboard } from "../features/today/dashboard/dashboard"
import { configureTests, renderSp } from "./helpers"

configureTests()

function tile(kind: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[data-widget-kind="${kind}"]`)
  if (!found) throw new Error(`no ${kind} tile`)
  return found
}

/** The grid cell of a tile: the tile itself and, while it is selected in edit mode, its palette button. */
function tileBox(kind: string): HTMLElement {
  const box = tile(kind).closest<HTMLElement>("[data-tile-id]")
  if (!box) throw new Error(`no ${kind} tile box`)
  return box
}

describe("Dashboard widgets", () => {
  test("shows the saved widgets with their colours and readable text", async () => {
    renderSp(<Dashboard />)

    await screen.findByRole("heading", { name: "My widgets" })
    expect(document.querySelector('[data-widget-kind="clock_next_lesson"]')).toBeNull()
    expect(tile("next_lesson")).toHaveAttribute("data-widget-size", "2x1")
    expect(tile("homework")).toHaveAttribute("data-text-color", "#FFFFFF")
  })

  test("adds a widget from the catalogue, resizes it, colours it and saves", async () => {
    const bodies: { version: number; widgets: Record<string, unknown>[] }[] = []
    server.use(
      http.put(apiUrl("/v1/me/dashboard"), async ({ request }) => {
        const body = (await request.json()) as (typeof bodies)[number]
        bodies.push(body)
        return HttpResponse.json({
          version: body.version + 1,
          widgets: body.widgets,
        })
      }),
    )
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Add widget" }))
    await user.click(within(screen.getByRole("list", { name: "Widget catalogue" })).getByText("Study idea"))
    expect(tile("notebook_prompt")).toHaveAttribute("data-widget-size", "2x1")

    await user.click(screen.getByRole("button", { name: "Select Study idea" }))
    const editor = screen.getByRole("region", { name: "Widget settings" })
    expect(within(editor).queryByRole("button", { name: "1x1" })).toBeNull()
    await user.click(within(editor).getByRole("button", { name: "2x2" }))
    expect(tile("notebook_prompt")).toHaveAttribute("data-widget-size", "2x2")

    await user.click(within(tileBox("notebook_prompt")).getByRole("button", { name: "Colour" }))
    await user.click(screen.getByRole("button", { name: "#FFCC00" }))
    expect(tile("notebook_prompt")).toHaveAttribute("data-text-color", "#000000")
    await user.click(screen.getByRole("button", { name: "#1C1C1E" }))
    expect(tile("notebook_prompt")).toHaveAttribute("data-text-color", "#FFFFFF")

    await user.click(screen.getByRole("button", { name: "Done" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.version).toBe(dashboardLayout.version)
    const saved = bodies[0]?.widgets ?? []
    // the saved layout keeps the kept widgets of the stored one, the Today widgets appended on read, and the new tile
    const kept = dashboardLayout.widgets.filter((w) => !RETIRED_KINDS.includes(w.kind)).length
    expect(saved).toHaveLength(kept + TODAY_KINDS.length + 1)
    expect(saved.find((w) => w.kind === "notebook_prompt")).toMatchObject({
      size: "2x2",
      color: "#1C1C1E",
    })
    expect(saved.every((w) => !("text_color" in w))).toBe(true)
    await screen.findByRole("button", { name: "Edit" })
  })

  test("the colour is picked in a popover on the selected tile, and Escape closes it and returns focus", async () => {
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Select Tasks" }))

    const editor = screen.getByRole("region", { name: "Widget settings" })
    expect(within(editor).queryByRole("group", { name: "Colour" })).toBeNull()
    expect(screen.getAllByRole("button", { name: "Colour" })).toHaveLength(1)

    const palette = within(tileBox("homework")).getByRole("button", { name: "Colour" })
    await user.click(palette)
    expect(palette).toHaveAttribute("aria-expanded", "true")
    expect(
      within(screen.getByRole("group", { name: "Colour" })).getByRole("button", { name: "#34C759" }),
    ).toBeInTheDocument()

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("button", { name: "#34C759" })).toBeNull())
    expect(palette).toHaveFocus()
  })

  test("the palette button is on the selected tile only, and a colour picked there is saved", async () => {
    const bodies: { widgets: Record<string, unknown>[] }[] = []
    server.use(
      http.put(apiUrl("/v1/me/dashboard"), async ({ request }) => {
        const body = (await request.json()) as { version: number; widgets: Record<string, unknown>[] }
        bodies.push(body)
        return HttpResponse.json({ version: body.version + 1, widgets: body.widgets })
      }),
    )
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Select Tasks" }))
    expect(within(tileBox("homework")).getByRole("button", { name: "Colour" })).toBeInTheDocument()
    expect(within(tileBox("next_lesson")).queryByRole("button", { name: "Colour" })).toBeNull()

    await user.click(within(tileBox("homework")).getByRole("button", { name: "Colour" }))
    await user.click(screen.getByRole("button", { name: "#34C759" }))
    expect(tile("homework")).toHaveAttribute("data-text-color", "#000000")

    await user.click(screen.getByRole("button", { name: "Default colour" }))
    expect(tile("homework")).not.toHaveAttribute("data-text-color")
    await user.click(screen.getByRole("button", { name: "#34C759" }))

    await user.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.widgets.find((w) => w.kind === "homework")).toMatchObject({ color: "#34C759" })
  })

  test("deletes a widget", async () => {
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Select Tasks" }))
    await user.click(screen.getByRole("button", { name: "Remove" }))

    expect(document.querySelector('[data-widget-kind="homework"]')).toBeNull()
  })

  test("a stale version shows the conflict message", async () => {
    server.use(http.put(apiUrl("/v1/me/dashboard"), () => problem(409, "dashboard/version-conflict", "Conflict")))
    const { user } = renderSp(<Dashboard />)

    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("changed on another device")
  })

  test("the study idea widget picks one of the templates and links to a notebook", async () => {
    const { user } = renderSp(<Dashboard />)
    await user.click(await screen.findByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Add widget" }))
    await user.click(within(screen.getByRole("list", { name: "Widget catalogue" })).getByText("Study idea"))

    expect((await screen.findByTestId("notebook-prompt")).textContent?.length).toBeGreaterThan(10)
  })
})
