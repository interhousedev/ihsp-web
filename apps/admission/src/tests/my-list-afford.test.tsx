import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "bun:test"
import { http, HttpResponse } from "msw"
import { UniListStage } from "../features/chooser/components/list-stage"
import { institution, listEntry, mockChooser } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

const messages = {
  chooser: {
    list: {
      noUpcomingDeadline: "No upcoming deadline",
      deadlineMissing: "{round} deadline not on file",
      officialSite: "Official site",
      gate: "{institution}: a binding round needs a clear affordability check first.",
      fee: {
        unpaid: "Fee not paid",
        paid: "Fee paid",
        waiver_requested: "Waiver requested",
        waiver_approved: "Waiver approved",
      },
    },
    planning: { showDetails: "Show details", hideDetails: "Hide details" },
    afford: {
      why: {
        noCost: "The cost of this college is not in the catalog yet.",
        noBudget: "Your family budget is missing.",
        budgetLink: "Add your budget",
        gap: "Yearly gap: {gap}.",
        unlock: "Binding rounds unlock after sign-off.",
      },
    },
  },
}

afterEach(() => server.resetHandlers())

const profile = (answers: Record<string, unknown>) =>
  http.get(apiUrl("/v1/admission/me/profile"), () => HttpResponse.json({ answers, lock_version: 1 }))

describe("list stage planning, gate and deadline", () => {
  it("ADM-LIST-2: the affordability gate shows its message and opens the panel", async () => {
    mockChooser({ list: [listEntry({ id: "e1", institution: institution({ id: "i1", name: "Alpha U" }) })] })
    server.use(
      profile({ q32: "under_20k" }),
      http.patch(apiUrl("/v1/admission/list/e1"), () =>
        HttpResponse.json(
          { type: "admission/affordability_gate", title: "Gate", status: 422, params: { institution: "Alpha U" } },
          { status: 422 },
        ),
      ),
    )
    renderAdmissionApp(<UniListStage />, { messages })
    const round = await screen.findByLabelText("Round of Alpha U")
    fireEvent.change(round, { target: { value: "ED" } })
    expect(await screen.findByText(/Alpha U: a binding round needs a clear affordability check first/)).toBeTruthy()
    expect(screen.queryByRole("region", { name: "Affordability" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Check affordability" }))
    expect(await screen.findByRole("region", { name: "Affordability" })).toBeTruthy()
  })

  it("ADM-LIST-3: an unknown status says why: no cost, no budget, binding rule", async () => {
    mockChooser({
      list: [listEntry({ id: "e1", round: "ED", institution: institution({ id: "i1", coa_total: null }) })],
    })
    server.use(
      profile({}),
      http.get(apiUrl("/v1/admission/config"), () =>
        HttpResponse.json({
          workflow: {
            rounds: [
              { id: "RD", binding: false },
              { id: "ED", binding: true },
            ],
          },
        }),
      ),
    )
    renderAdmissionApp(<UniListStage />, { messages })
    fireEvent.click(await screen.findByRole("button", { name: "Show details of Uni One" }))
    expect(await screen.findByText(/cost of this college is not in the catalog/)).toBeTruthy()
    const link = await screen.findByRole("link", { name: "Add your budget" })
    expect(link.getAttribute("href")).toBe("/setup?q=q32")
    expect(screen.getByText(/Binding rounds unlock/)).toBeTruthy()
  })

  it("ADM-LIST-4: the deadline follows the chosen round", async () => {
    const dated = (plan: string, date: string) => ({ plan, date, notify_by: null, cycle: null, label_short: plan })
    const inst = institution({
      id: "i1",
      deadlines: [dated("RD", "2099-01-05")],
      sources: [{ key: "site", url: "https://alpha.example/admissions", year: null }],
    })
    mockChooser({ list: [listEntry({ id: "e1", round: "ED", institution: inst })] })
    renderAdmissionApp(<UniListStage />, { messages })
    expect(await screen.findByText("ED deadline not on file")).toBeTruthy()
    const link = screen.getByRole("link", { name: "Official site" })
    expect(link.getAttribute("href")).toBe("https://alpha.example/admissions")
    expect(screen.queryByText(/2099/)).toBeNull()
  })

  it("never shows a past deadline as the next one", async () => {
    const dated = (plan: string, date: string) => ({ plan, date, notify_by: null, cycle: null, label_short: plan })
    const inst = institution({ id: "i2", deadlines: [dated("RD", "2020-01-05")], next_deadline: null })
    mockChooser({ list: [listEntry({ id: "e2", round: "RD", institution: inst })] })
    renderAdmissionApp(<UniListStage />, { messages })
    expect(await screen.findByText("No upcoming deadline")).toBeTruthy()
    expect(screen.queryByText(/2020/)).toBeNull()
  })
})
