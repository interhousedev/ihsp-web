import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { listEntry } from "../../tests/chooser-handlers"
import { renderAdmissionApp } from "../../tests/helpers"
import { BudgetPage } from "./components/budget-page"
import type { Budget, BudgetRow } from "./types"

// English copy of the "budget" bundle, so the test does not depend on the merged message files.
const messages = {
  budget: {
    views: {
      label: "Budget views",
      budget: "Budget",
      scholarships: "Scholarships",
    },
    apply: {
      title: "Cost to apply",
    },
    feeUnknown: "Fee unknown",
    statusFor: "Fee status for {name}",
    status: {
      unpaid: "Unpaid",
      paid: "Paid",
      waiver_requested: "Waiver requested",
      waiver_approved: "Waiver approved",
    },
    aidForms: "Financial aid forms",
    noAidForms: "No aid forms required",
    aidFormsUnknown: "Aid forms unknown",
    form: {
      css_profile: "CSS Profile",
      fafsa: "FAFSA",
      idoc: "IDOC",
      institutional: "Institutional form",
    },
    aidDeadline: "Aid deadline {date}",
    totals: {
      title: "Application fees",
      paid: "paid {amount}",
      waived: "waived {amount}",
      unknown: "{count} unknown",
      cssProfile: "CSS Profile: {count} universities — fees on College Board",
    },
    attend: {
      title: "Cost to attend",
      university: "University",
      annual: "Per year",
      aid: "Aid estimate",
      gap: "Gap",
    },
    empty: "Your list is empty. Add universities to see what applying costs.",
    emptyAction: "Find universities",
    startEssays: "Start essays for {count} universities",
    moreScholarships: "More scholarships and opportunities",
  },
}

const row = (id: string, name: string, overrides: Partial<BudgetRow> = {}): BudgetRow => ({
  admit_rate: null,
  aid_profile: null,
  entry_id: id,
  institution: { id: `i-${id}`, name, logo_url: null, logo_fit: "circle", logo_zoom: 1 },
  round: "RD",
  application_fee: { amount: "75", currency: "USD", source_url: "https://example.edu/fees", year: 2026 },
  fee_status: "unpaid",
  aid_forms: ["fafsa"],
  aid_forms_known: true,
  aid_deadline: null,
  cost_to_attend: null,
  ...overrides,
})

const budget: Budget = {
  rows: [
    row("e1", "Uni One"),
    row("e2", "Uni Two", { application_fee: { amount: "60", currency: "GBP", source_url: null, year: null } }),
    row("e3", "Uni Three", { application_fee: null, aid_forms: ["css_profile"] }),
  ],
  totals: {
    by_currency: [
      { currency: "USD", known_total: "75", paid_total: "0", waived_total: "0" },
      { currency: "GBP", known_total: "60", paid_total: "0", waived_total: "0" },
    ],
    css_profile_schools: 2,
    unknown_fee_count: 1,
  },
}

function serve(data: Budget = budget) {
  const patches: unknown[] = []
  server.use(
    http.get(apiUrl("/v1/admission/chooser/budget"), () => HttpResponse.json(data)),
    http.get(apiUrl("/v1/admission/list"), () =>
      HttpResponse.json(data.rows.map((r) => listEntry({ id: r.entry_id, lock_version: 7 }))),
    ),
    http.patch(apiUrl("/v1/admission/list/:id"), async ({ request, params }) => {
      patches.push({ id: params.id, body: await request.json() })
      return HttpResponse.json(listEntry({ id: String(params.id), lock_version: 8 }))
    }),
  )
  return patches
}

describe("budget page", () => {
  it("totals per currency, never summed, with the unknown count and a CSS line without an amount", async () => {
    serve()
    renderAdmissionApp(<BudgetPage />, { route: "/chooser/budget/", messages })
    const totals = await screen.findByRole("region", { name: "Application fees" })
    expect(within(totals).getByText("$75")).toBeTruthy()
    expect(within(totals).getByText("£60")).toBeTruthy()
    expect(within(totals).queryByText("$135")).toBeNull()
    expect(within(totals).getByText("1 unknown")).toBeTruthy()
    const css = within(totals).getByRole("link", { name: "CSS Profile: 2 universities — fees on College Board" })
    expect(css.getAttribute("href")).toBe("https://cssprofile.collegeboard.org/")
    expect(css.textContent).not.toMatch(/[$£]/)
  })

  it("changing the fee status PATCHes the entry with its lock version", async () => {
    const patches = serve()
    renderAdmissionApp(<BudgetPage />, { route: "/chooser/budget/", messages })
    const select = await screen.findByLabelText("Fee status for Uni One")
    await waitFor(() => expect(screen.getAllByRole("combobox").length).toBe(3))
    fireEvent.change(select, { target: { value: "paid" } })
    await waitFor(() => expect(patches).toEqual([{ id: "e1", body: { lock_version: 7, fee_status: "paid" } }]))
  })

  it("an empty list points to the search", async () => {
    serve({ rows: [], totals: { by_currency: [], css_profile_schools: 0, unknown_fee_count: 0 } })
    renderAdmissionApp(<BudgetPage />, { route: "/chooser/budget/", messages })
    const link = await screen.findByRole("link", { name: "Find universities" })
    expect(link.getAttribute("href")).toBe("/chooser?step=match")
  })

  it("?view=scholarships shows the scholarships and the opportunities link", async () => {
    server.use(http.get(apiUrl("/v1/admission/catalog/scholarships"), () => HttpResponse.json([])))
    renderAdmissionApp(<BudgetPage />, { route: "/chooser/budget/?view=scholarships", messages })
    const more = await screen.findByRole("link", { name: "More scholarships and opportunities" })
    expect(more.getAttribute("href")).toBe("/opportunities/scholarships")
    expect(screen.queryByText("Cost to apply")).toBeNull()
  })
})
