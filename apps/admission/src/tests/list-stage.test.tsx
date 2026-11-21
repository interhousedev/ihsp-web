import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "bun:test"
import { http, HttpResponse } from "msw"
import { UniListStage } from "../features/chooser/components/list-stage"
import { institution, listEntry, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

afterEach(() => server.resetHandlers())

const axes = (score: number) =>
  (["afford", "goals", "profile", "traits"] as const).map((key) => ({ key, score, weight: 0.25, why: [], raise: [] }))

function serve(
  entries: ReturnType<typeof listEntry>[],
  totals: Record<string, number | null>,
  answers: object = { budget: "under_30k" },
) {
  server.use(
    http.get(apiUrl("/v1/admission/list/fit"), () =>
      HttpResponse.json({
        weights: { afford: 0.25, goals: 0.25, profile: 0.25, traits: 0.25 },
        items: entries.map((entry) => ({
          list_entry_id: entry.id,
          institution_id: entry.institution.id,
          total: totals[entry.id] ?? null,
          axes: axes(totals[entry.id] ?? 0),
        })),
      }),
    ),
    http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({ answers, lock_version: 1 })),
    http.get(apiUrl("/v1/admission/tasks"), () => HttpResponse.json({ items: [], total: 0 })),
  )
}

const cheap = listEntry({
  id: "a",
  institution: institution({ id: "ia", name: "Alpha U", cost_after_aid: "12000", coa_total: "50000" }),
})
const dear = listEntry({
  id: "b",
  institution: institution({ id: "ib", name: "Beta U", cost_after_aid: "45000", coa_total: "60000" }),
})
const home = listEntry({
  id: "c",
  institution: institution({ id: "ic", name: "Gamma U", country: "Uzbekistan", cost_after_aid: null, coa_total: null }),
})

describe("list stage", () => {
  it("sorts by fit with unknown last, shows the cost after aid with the gap, and tags a home university", async () => {
    mockChooser({ list: [home, dear, cheap] })
    serve([home, dear, cheap], { a: 80, b: 55, c: null })
    renderAdmissionApp(<UniListStage />)
    await screen.findByText("Alpha U")
    const names = within(screen.getByRole("list", { name: "Your list" }))
      .getAllByRole("link", { name: /U$/ })
      .map((l) => l.textContent)
    expect(names).toEqual(["Alpha U", "Beta U", "Gamma U"])
    expect(screen.getByText(/Fit 80/)).toBeTruthy()
    const alpha = screen.getAllByRole("listitem").find((li) => within(li).queryByRole("link", { name: "Alpha U" }))!
    expect(within(alpha).getAllByText("≈ $12K").length).toBeGreaterThan(0)
    expect(screen.getByText("$18K under budget")).toBeTruthy()
    expect(screen.getByText("$15K over budget")).toBeTruthy()
    expect(screen.getByText("Safe at home")).toBeTruthy()
    expect(screen.getByText(/Fit unknown/)).toBeTruthy()
  })

  it("totals the gap to the family budget", async () => {
    mockChooser({ list: [dear, cheap] })
    serve([dear, cheap], { a: 80, b: 55 })
    renderAdmissionApp(<UniListStage />)
    const totals = await screen.findByRole("region", { name: "Totals" })
    expect(within(totals).getByText("Family budget $30K a year")).toBeTruthy()
    expect(within(totals).getByText("1 within budget")).toBeTruthy()
    expect(within(totals).getByText("1 over budget, on average by $15K")).toBeTruthy()
  })

  it("warns past the soft cap of 12 and not at 12", async () => {
    const many = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        listEntry({ id: `e${i}`, institution: institution({ id: `i${i}`, name: `Uni ${i}` }) }),
      )
    mockChooser({ list: many(13) })
    serve(many(13), {})
    renderAdmissionApp(<UniListStage />)
    expect(await screen.findByTestId("soft-cap")).toBeTruthy()
  })

  it("offers research when a fact is missing and opens the chat panel for that university", async () => {
    mockChooser({ list: [home] })
    serve([home], {})
    renderAdmissionApp(<UniListStage />)
    fireEvent.click(await screen.findByRole("button", { name: "Research" }))
    expect(await screen.findByRole("dialog")).toBeTruthy()
    expect(screen.getByText(/Missing: cost, deadline, chance/)).toBeTruthy()
  })

  it("adding a university offers one tap to create the application plan, tasks carry the list entry id", async () => {
    const posted: { list_entry_id?: string }[] = []
    const added = listEntry({ id: "n", institution: institution({ id: "in", name: "New U" }) })
    mockChooser({ items: [institution({ id: "in", name: "New U" })], list: [] })
    serve([], {})
    server.use(
      http.post(apiUrl("/v1/admission/list"), () => HttpResponse.json(added)),
      http.post(apiUrl("/v1/admission/tasks"), async ({ request }) => {
        const body = (await request.json()) as { list_entry_id?: string }
        posted.push(body)
        return HttpResponse.json({ ...body, id: `t${posted.length}` })
      }),
    )
    renderAdmissionApp(<UniListStage />)
    fireEvent.click(await screen.findByRole("button", { name: /Add a university/ }))
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "new" } })
    fireEvent.mouseDown(await screen.findByText("New U"))
    fireEvent.click(await screen.findByRole("button", { name: "Create application plan" }))
    await waitFor(() => expect(posted).toHaveLength(6))
    expect(posted.every((task) => task.list_entry_id === "n")).toBe(true)
  })
})
