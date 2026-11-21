/** ADM-UX-A1: the college picker, the catalog token card, proposal review, and the proposal facts form. */
import { afterEach, describe, expect, setSystemTime, spyOn, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import type { Messages } from "@ihsp/i18n"
import ru from "../../messages/ru.json"
import { CatalogTokenCard } from "../features/catalog-staff/components/catalog-token-card"
import { CatalogStaffBody } from "../features/catalog-staff/components/catalog-staff-page"
import { ProposeDialog } from "../features/catalog-staff/components/propose-dialog"
import type { Proposal } from "../features/catalog-staff/api"
import { InstitutionCombobox } from "../features/chooser/components/institution-combobox"
import { InstitutionDetail } from "../features/chooser/components/institution-detail"
import { institution, mockChooser, richInstitution } from "./chooser-handlers"
import { renderAdmissionApp } from "./helpers"

const SPEC_PATH = "/v1/admission/staff/catalog/fact-spec"
const PROPOSALS = "/v1/admission/staff/catalog/proposals"
const TOKENS = "/v1/id/personal-tokens"

const intFact = (key: string, label: string, kind = "int") => ({
  key,
  kind,
  label,
  min: 0,
  max: 100,
  step: 1,
  unit: null,
  options: [],
  parts: [],
})

const SPEC = {
  groups: [
    {
      key: "admissions",
      label: "Admissions",
      facts: [
        intFact("acceptance_rate", "Acceptance rate"),
        intFact("graduation_rate", "Graduation rate", "percent"),
        {
          key: "sat_range",
          kind: "range",
          label: "SAT range",
          min: 400,
          max: 1600,
          step: 10,
          unit: null,
          options: [],
          parts: [],
        },
      ],
    },
  ],
}

const proposal = (overrides: Partial<Proposal> = {}): Proposal => ({
  id: "p1",
  kind: "institution",
  target_id: null,
  fields: { name: "Test University", country: "GB" },
  source_url: "https://example.edu/admissions",
  note: null,
  status: "pending",
  proposed_by: "u1",
  created_at: "2026-01-01T00:00:00Z",
  reviewed_by: null,
  reviewed_at: null,
  review_note: null,
  applied_id: null,
  lock_version: 0,
  ...overrides,
})

/** Opens the facts accordion of a proposal for an existing school and returns once the form is on screen. */
async function openFacts(name: RegExp) {
  fireEvent.change(await screen.findByRole("combobox", { name: "University" }), { target: { value: "Uni" } })
  fireEvent.mouseDown(await screen.findByRole("option", { name }))
  fireEvent.click(await screen.findByRole("button", { name: "Next" }))
  fireEvent.click(await screen.findByRole("button", { name: /Admissions/ }))
}

describe("ADM-UX-A1-B1 institution listbox", () => {
  const items = [
    institution({ id: "a", name: "Alpha College" }),
    institution({ id: "b", name: "Beta College" }),
    institution({ id: "c", name: "Gamma College" }),
  ]

  test("ADM-UX-A1-B1: typing searches the catalog and the keys move the active option", async () => {
    const { catalogRequests } = mockChooser({ items })
    const picked: (string | null)[] = []
    renderAdmissionApp(<InstitutionCombobox value={null} onChange={(item) => picked.push(item?.id ?? null)} />)
    const input = screen.getByRole("combobox", { name: "University" })
    fireEvent.change(input, { target: { value: "college" } })
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)
    await waitFor(() => expect(catalogRequests.some((url) => url.searchParams.get("q") === "college")).toBe(true))
    expect(input.getAttribute("aria-expanded")).toBe("true")
    expect(input.getAttribute("aria-controls")).toBe(screen.getByRole("listbox").id)

    fireEvent.keyDown(input, { key: "End" })
    expect(input.getAttribute("aria-activedescendant")).toBe(options[2]!.id)
    fireEvent.keyDown(input, { key: "Home" })
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0]!.id)
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1]!.id)
    fireEvent.keyDown(input, { key: "Enter" })
    await waitFor(() => expect(picked).toEqual(["b"]))
  })

  test("ADM-UX-A1-B1: pressing an option with the pointer picks it and closes the list", async () => {
    mockChooser({ items })
    const picked: (string | null)[] = []
    renderAdmissionApp(<InstitutionCombobox value={null} onChange={(item) => picked.push(item?.id ?? null)} />)
    const input = screen.getByRole("combobox", { name: "University" })
    fireEvent.change(input, { target: { value: "gam" } })
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Gamma College/ }))
    await waitFor(() => expect(picked).toEqual(["c"]))
    expect(screen.queryByRole("listbox")).toBeNull()
  })
})

describe("ADM-UX-A1-S3 catalog token with a wrong code", () => {
  test("ADM-UX-A1-S3: a wrong one-time code shows an inline error and keeps the form", async () => {
    server.use(
      http.get(apiUrl(TOKENS), () => HttpResponse.json([])),
      http.post(apiUrl(TOKENS), () =>
        HttpResponse.json(
          { type: "auth/otp-invalid", title: "The code is wrong", status: 401, attempts_left: 2 },
          { status: 401, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<CatalogTokenCard />)
    const name = await screen.findByLabelText("Token name")
    fireEvent.change(name, { target: { value: "Agent" } })
    const code = screen.getByLabelText("Code")
    fireEvent.change(code, { target: { value: "123456" } })
    fireEvent.click(screen.getByRole("button", { name: "Create token" }))
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toBe("The code is wrong. Check it or send a new one.")
    expect(code.getAttribute("aria-invalid")).toBe("true")
    expect(code.getAttribute("aria-describedby")).toBe(alert.id)
    expect((name as HTMLInputElement).value).toBe("Agent")
    expect((code as HTMLInputElement).value).toBe("123456")
  })
})

describe("ADM-UX-A1-S4 revoking a catalog token", () => {
  test("ADM-UX-A1-S4: revoking removes the token and confirms it; revoked tokens are not listed", async () => {
    const token = (id: string, name: string, revoked_at: string | null) => ({
      id,
      name,
      prefix: `ihsp_${id}`,
      scopes: ["admission:catalog"],
      created_at: "2026-09-01T08:00:00Z",
      expires_at: "2026-12-01T08:00:00Z",
      last_used_at: null,
      revoked_at,
    })
    let tokens = [token("t1", "Live agent", null), token("t2", "Old agent", "2026-09-02T08:00:00Z")]
    const deleted: unknown[] = []
    server.use(
      http.get(apiUrl(TOKENS), () => HttpResponse.json(tokens)),
      http.delete(apiUrl(`${TOKENS}/:id`), ({ params }) => {
        deleted.push(params.id)
        tokens = tokens.filter((each) => each.id !== params.id)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const success = spyOn(toast, "success").mockImplementation(() => "")
    renderAdmissionApp(<CatalogTokenCard />)
    expect(await screen.findByText("Live agent")).toBeTruthy()
    expect(screen.queryByText("Old agent")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Live agent/ }))
    await waitFor(() => expect(deleted).toEqual(["t1"]))
    await waitFor(() => expect(screen.queryByText("Live agent")).toBeNull())
    expect(success).toHaveBeenCalledWith("Token revoked")
    success.mockRestore()
  })
})

describe("ADM-UX-A1-S6 review cards", () => {
  test("ADM-UX-A1-S6: a card shows the school name, labelled fields and no empty values", async () => {
    mockChooser({ items: [institution({ id: "0198f0a0-0000-7000-8000-0000000000a1", name: "Uni One" })] })
    server.use(
      http.get(apiUrl(PROPOSALS), () =>
        HttpResponse.json({
          items: [
            proposal({
              target_id: "0198f0a0-0000-7000-8000-0000000000a1",
              fields: { country: "GB", city: "", logo_url: null, website_domain: "uni.edu" },
            }),
          ],
          can_review: true,
        }),
      ),
    )
    renderAdmissionApp(<CatalogStaffBody />)
    expect(await screen.findByText("Uni One")).toBeTruthy()
    expect(screen.queryByText(/0198f0a0/)).toBeNull()
    expect(screen.getByText("Country (2 letters)")).toBeTruthy()
    expect(screen.getByText("Website domain")).toBeTruthy()
    expect(screen.queryByText("City")).toBeNull()
    expect(screen.queryByText("logo_url")).toBeNull()
    expect(screen.queryByText("country")).toBeNull()
  })
})

describe("ADM-UX-A1-S7 localized kind select", () => {
  test("ADM-UX-A1-S7: the kind trigger shows the Russian label, not the value", async () => {
    mockChooser()
    server.use(http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)))
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />, {
      locale: "ru",
      messages: ru as unknown as Messages,
    })
    const trigger = await screen.findByRole("combobox", { name: "Что" })
    expect(trigger.textContent).toContain("Университет")
    expect(trigger.textContent).not.toContain("institution")
  })
})

describe("ADM-UX-A1-S9 editing an existing school", () => {
  const school = institution({
    id: "i1",
    name: "Uni One",
    details: [
      {
        key: "admissions",
        label: "Admissions",
        rows: [
          {
            key: "acceptance_rate",
            label: "Acceptance rate",
            kind: "int",
            value: 5,
            value_text: "5%",
            source_url: "https://example.edu/rate",
            year: 2025,
          },
          {
            key: "graduation_rate",
            label: "Graduation rate",
            kind: "percent",
            value: 80,
            value_text: "80%",
            source_url: "https://example.edu/grad",
            year: 2025,
          },
        ],
      },
    ],
  })

  test("ADM-UX-A1-S9: picking a school prefills its facts and only the changed one is sent", async () => {
    let body: { target_id?: string; fields?: unknown; facts?: Record<string, { value: unknown }> } | null = null
    mockChooser({ items: [school] })
    server.use(
      http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)),
      http.post(apiUrl(PROPOSALS), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json(proposal(), { status: 201 })
      }),
    )
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    await openFacts(/Uni One/)
    const rate = (await screen.findByLabelText("Acceptance rate")) as HTMLInputElement
    await waitFor(() => expect(rate.value).toBe("5"))
    expect((screen.getByLabelText("Graduation rate") as HTMLInputElement).value).toBe("80")
    expect((screen.getByLabelText("Graduation rate: Source link (https)") as HTMLInputElement).value).toBe(
      "https://example.edu/grad",
    )
    fireEvent.change(screen.getByLabelText("Graduation rate"), { target: { value: "90" } })
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(body).not.toBeNull())
    expect(body!.target_id).toBe("i1")
    expect(Object.keys(body!.facts ?? {})).toEqual(["graduation_rate"])
    expect(body!.facts!.graduation_rate!.value).toBe(90)
    expect(body!.fields).toEqual({})
  })

  test("ADM-UX-A1-S9: nothing is sent while nothing differs from the current facts", async () => {
    mockChooser({ items: [school] })
    server.use(http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)))
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    await openFacts(/Uni One/)
    const rate = (await screen.findByLabelText("Acceptance rate")) as HTMLInputElement
    await waitFor(() => expect(rate.value).toBe("5"))
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe("ADM-UX-A1-S10 inline validation", () => {
  test("ADM-UX-A1-S10: a non-https source link and an out-of-range percent are flagged on the field", async () => {
    mockChooser({ items: [institution({ id: "i1", name: "Uni One" })] })
    server.use(http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)))
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    await openFacts(/Uni One/)
    const percent = await screen.findByLabelText("Graduation rate")
    fireEvent.change(percent, { target: { value: "150" } })
    expect(percent.getAttribute("aria-invalid")).toBe("true")
    const message = await screen.findByText("Enter a number from 0 to 100")
    expect(percent.getAttribute("aria-describedby")).toBe(message.id)

    const link = screen.getByLabelText("Graduation rate: Source link (https)")
    fireEvent.change(link, { target: { value: "http://example.edu/x" } })
    expect(link.getAttribute("aria-invalid")).toBe("true")
    const error = await screen.findByText("Enter a link that starts with https://")
    expect(link.getAttribute("aria-describedby")).toBe(error.id)
    fireEvent.change(link, { target: { value: "https://example.edu/x" } })
    expect(link.getAttribute("aria-invalid")).toBeNull()
    expect(screen.queryByText("Enter a link that starts with https://")).toBeNull()
  })
})

describe("ADM-UX-A1-N3 range inputs", () => {
  test("ADM-UX-A1-N3: both ends are named and use From and To placeholders", async () => {
    mockChooser({ items: [institution({ id: "i1", name: "Uni One" })] })
    server.use(http.get(apiUrl(SPEC_PATH), () => HttpResponse.json(SPEC)))
    renderAdmissionApp(<ProposeDialog open onOpenChange={() => {}} />)
    await openFacts(/Uni One/)
    const min = (await screen.findByLabelText("SAT range min")) as HTMLInputElement
    const max = screen.getByLabelText("SAT range max") as HTMLInputElement
    expect(min.placeholder).toBe("From")
    expect(max.placeholder).toBe("To")
    expect(screen.queryByLabelText(/SAT range,/)).toBeNull()
    expect(screen.queryByLabelText("SAT range min,")).toBeNull()
  })
})

describe("ADM-UX-A1-N4 rejecting a proposal", () => {
  test("ADM-UX-A1-N4: Reject asks first and sends the review with the reason only after confirming", async () => {
    const bodies: unknown[] = []
    server.use(
      http.get(apiUrl(PROPOSALS), () => HttpResponse.json({ items: [proposal()], can_review: true })),
      http.post(apiUrl(`${PROPOSALS}/p1/review`), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json(proposal({ status: "rejected", lock_version: 1 }))
      }),
    )
    renderAdmissionApp(<CatalogStaffBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Reject this proposal?")).toBeTruthy()
    expect(bodies).toEqual([])
    fireEvent.change(within(dialog).getByLabelText("Reason (optional)"), { target: { value: "Duplicate" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }))
    await waitFor(() => expect(bodies).toEqual([{ approve: false, note: "Duplicate", lock_version: 0 }]))
  })
})

describe("ADM-UX-A2 institution detail", () => {
  afterEach(() => setSystemTime())

  function showDetail(school: { id: string }, scholarships: unknown[] = [], tab = "money") {
    mockChooser()
    server.use(
      http.get(apiUrl(`/v1/admission/universities/${school.id}/chances`), () =>
        HttpResponse.json({ type: "about:blank", title: "Not found", status: 404 }, { status: 404 }),
      ),
      http.get(apiUrl("/v1/admission/outcomes/summary"), () =>
        HttpResponse.json({ type: "about:blank", title: "Not found", status: 404 }, { status: 404 }),
      ),
      http.get(apiUrl(`/v1/admission/catalog/institutions/${school.id}`), () => HttpResponse.json(school)),
      http.get(apiUrl("/v1/admission/catalog/scholarships"), () => HttpResponse.json(scholarships)),
    )
    renderAdmissionApp(<InstitutionDetail />, { route: `/chooser/institution/?id=${school.id}&tab=${tab}` })
  }

  test("ADM-UX-A2-S2: sources read as a label and a year, and scholarships have a heading", async () => {
    showDetail(
      richInstitution({
        sources: [{ key: "city_type", url: "https://www.rich.edu/facts", year: 2025 }],
      }),
      [
        {
          id: "s1",
          name: "Founders Grant",
          basis: "institution",
          country: null,
          coverage_min: 50,
          coverage_max: 100,
          covers: ["tuition"],
          cycle: 2026,
          institution_id: "i2",
          provider: "Rich University",
          status: "open",
          url: null,
        },
      ],
    )
    const sources = await screen.findByTestId("sources")
    expect(within(sources).getByRole("link", { name: "Official website · 2025" })).toBeTruthy()
    expect(sources.textContent).not.toContain("city_type")
    expect(await screen.findByText("Founders Grant")).toBeTruthy()
    expect(screen.getAllByRole("heading", { name: "Scholarships" }).length).toBeGreaterThan(0)
    expect(screen.queryByText("institution")).toBeNull()
  })

  test("ADM-UX-A2-S5: the deadline stat shows the earliest deadline that is still ahead", async () => {
    setSystemTime(new Date("2026-06-15T12:00:00"))
    const deadline = (date: string, label_short: string) => ({
      plan: "RD",
      date,
      notify_by: null,
      cycle: "2026-27",
      label_short,
      binding: false,
      time_zone: null,
    })
    showDetail(
      richInstitution({
        deadlines: [
          deadline("2026-01-10", "Past deadline"),
          deadline("2027-01-05", "Later deadline"),
          deadline("2026-12-01", "Next deadline day"),
        ],
      }),
    )
    const stats = await screen.findByTestId("key-stats")
    expect(within(stats).getByText("Next deadline day")).toBeTruthy()
    expect(within(stats).queryByText("Past deadline")).toBeNull()
    expect(within(stats).queryByText("Later deadline")).toBeNull()
  })

  test("ADM-UX-A2-S5: with only past deadlines the stat says there is no deadline", async () => {
    setSystemTime(new Date("2026-06-15T12:00:00"))
    showDetail(
      richInstitution({
        deadlines: [
          {
            plan: "RD",
            date: "2026-01-10",
            notify_by: null,
            cycle: "2025-26",
            label_short: "Past deadline",
            binding: false,
            time_zone: null,
          },
        ],
      }),
    )
    const stats = await screen.findByTestId("key-stats")
    expect(within(stats).getByText("No deadline")).toBeTruthy()
    expect(within(stats).queryByText("Past deadline")).toBeNull()
  })
})
