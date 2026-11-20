import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { ScoreCatalog, ScoreEntry, ScoreOverview, ScoreSection } from "./api"
import { TestsBody } from "./components/tests-page"

const BASE = "/v1/admission/test-scores"

const part = (key: string, name: string, min: number, max: number, step: number): ScoreSection => ({
  key,
  names: { en: name, ru: name, uz: name },
  min,
  max,
  step,
  choices: [],
})

const catalog: ScoreCatalog = {
  can_edit: false,
  items: [
    {
      id: "t-sat",
      key: "sat",
      names: { en: "SAT", ru: "SAT", uz: "SAT" },
      sections: [part("ebrw", "Reading and Writing", 200, 800, 10), part("math", "Math", 200, 800, 10)],
      total: part("total", "Total", 400, 1600, 10),
      total_mode: "sum",
      superscore: true,
      needs_label: false,
      needs_level: false,
      position: 1,
      active: true,
    },
    {
      id: "t-ielts",
      key: "ielts_academic",
      names: { en: "IELTS Academic", ru: "IELTS Academic", uz: "IELTS Academic" },
      sections: [
        part("listening", "Listening", 0, 9, 0.5),
        part("reading", "Reading", 0, 9, 0.5),
        part("writing", "Writing", 0, 9, 0.5),
        part("speaking", "Speaking", 0, 9, 0.5),
      ],
      total: part("overall", "Overall", 0, 9, 0.5),
      total_mode: "mean_half",
      superscore: false,
      needs_label: false,
      needs_level: false,
      position: 2,
      active: true,
    },
  ],
}

const entry = (id: string, ebrw: number, math: number, verified = false): ScoreEntry => ({
  id,
  test_id: "t-sat",
  status: "score_received",
  test_date: "2026-03-14",
  registration_deadline: null,
  label: null,
  level: null,
  sections: { ebrw, math },
  total: ebrw + math,
  certificate_document_id: null,
  verification_url: null,
  send_note: null,
  is_official: true,
  verified_at: verified ? "2026-04-01T00:00:00Z" : null,
  created_at: "2026-03-20T00:00:00Z",
  updated_at: "2026-03-20T00:00:00Z",
  source: "manual",
})

function overview(over: Partial<ScoreOverview> = {}): ScoreOverview {
  return { entries: [], summaries: [], is_owner: true, can_verify: false, exams: [], ...over }
}

function common(data: ScoreOverview) {
  server.use(
    http.get(apiUrl(`${BASE}/catalog`), () => HttpResponse.json(catalog)),
    http.get(apiUrl(BASE), () => HttpResponse.json(data)),
  )
}

describe("sat english evidence", () => {
  test("ADM-TESTS-SAT: a sat_erw catalog entry is offered with its 200-800 range", async () => {
    server.use(
      http.get(apiUrl(`${BASE}/catalog`), () =>
        HttpResponse.json({
          ...catalog,
          items: [
            ...catalog.items,
            {
              ...catalog.items[0],
              id: "t-erw",
              key: "sat_erw",
              names: { en: "SAT English", ru: "SAT English", uz: "SAT English" },
              sections: [],
              total: part("erw", "Reading and Writing", 200, 800, 10),
              total_mode: "manual",
              superscore: false,
            },
          ],
        }),
      ),
      http.get(apiUrl(BASE), () => HttpResponse.json(overview())),
    )
    renderAdmissionApp(<TestsBody />)
    fireEvent.click(await screen.findByRole("button", { name: /Add result/ }))
    const select = (await screen.findByLabelText("Test")) as HTMLSelectElement
    expect([...select.options].some((o) => o.textContent === "SAT English")).toBe(true)
    fireEvent.change(select, { target: { value: "t-erw" } })
    const total = (await screen.findByLabelText("Reading and Writing")) as HTMLInputElement
    expect(total.min).toBe("200")
    expect(total.max).toBe("800")
  })
})

describe("test scores", () => {
  test("the form follows the chosen test and sends validated sections", async () => {
    let body: unknown
    common(overview())
    server.use(
      http.post(apiUrl(BASE), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(entry("e1", 700, 750), { status: 201 })
      }),
    )
    renderAdmissionApp(<TestsBody />)
    fireEvent.click(await screen.findByRole("button", { name: /Add result/ }))
    const select = (await screen.findByLabelText("Test")) as HTMLSelectElement
    fireEvent.change(select, { target: { value: "t-sat" } })
    const math = (await screen.findByLabelText("Math")) as HTMLInputElement
    expect(math.max).toBe("800")
    expect(math.min).toBe("200")
    expect(math.step).toBe("10")
    expect(screen.queryByLabelText("Listening")).toBeNull()

    fireEvent.change(select, { target: { value: "t-ielts" } })
    const listening = (await screen.findByLabelText("Listening")) as HTMLInputElement
    expect(listening.max).toBe("9")
    expect(listening.step).toBe("0.5")
    expect(screen.queryByLabelText("Math")).toBeNull()

    fireEvent.change(select, { target: { value: "t-sat" } })
    fireEvent.change(await screen.findByLabelText("Reading and Writing"), { target: { value: "700" } })
    fireEvent.change(screen.getByLabelText("Math"), { target: { value: "750" } })
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "score_received" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect(body).toMatchObject({
        test_id: "t-sat",
        status: "score_received",
        sections: { ebrw: 700, math: 750 },
      }),
    )
  })

  test("cards show section bars, the superscore and the verified mark", async () => {
    common(
      overview({
        entries: [entry("e1", 700, 650, true), entry("e2", 650, 750)],
        summaries: [
          {
            test_id: "t-sat",
            best_entry_id: "e2",
            best_total: 1400,
            superscore_sections: { ebrw: 700, math: 750 },
            superscore_total: 1450,
          },
        ],
      }),
    )
    renderAdmissionApp(<TestsBody />)
    expect((await screen.findAllByText(/Superscore/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText("1450").length).toBeGreaterThan(0)
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText("Verified")).toBeTruthy()
  })

  test("staff with review rights verify a received result", async () => {
    let body: unknown
    common(overview({ entries: [entry("e1", 700, 650)], is_owner: false, can_verify: true }))
    server.use(
      http.post(apiUrl(`${BASE}/e1/verify`), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(entry("e1", 700, 650, true))
      }),
    )
    renderAdmissionApp(<TestsBody />)
    expect(screen.queryByRole("button", { name: /Add result/ })).toBeNull()
    fireEvent.click(await screen.findByRole("button", { name: "Mark verified" }))
    await waitFor(() => expect(body).toEqual({ verified: true }))
  })
})

describe("test scores: confirmation and server errors", () => {
  test("delete asks for confirmation first", async () => {
    let deleted = false
    common(overview({ entries: [entry("e1", 700, 650)] }))
    server.use(
      http.delete(apiUrl(`${BASE}/e1`), () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<TestsBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))
    expect(deleted).toBe(false)
    await screen.findByText("Delete this test result?")
  })

  test("a 422 shows the server message under the form", async () => {
    common(overview())
    server.use(
      http.post(apiUrl(BASE), () =>
        HttpResponse.json(
          { type: "about:blank", title: "Scores need a taken date", status: 422, params: { field: "test_date" } },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<TestsBody />)
    fireEvent.click(await screen.findByRole("button", { name: /Add result/ }))
    fireEvent.change(await screen.findByLabelText("Test"), { target: { value: "t-sat" } })
    fireEvent.click(await screen.findByRole("button", { name: "Save" }))
    await screen.findByText("Scores need a taken date")
  })
})

describe("certificates in the test scores", () => {
  test("a certificate entry shows read-only and unmatched standard exams are listed", async () => {
    common(
      overview({
        entries: [{ ...entry("c1", 700, 750), source: "certificate" }],
        exams: [
          {
            entry_id: "x1",
            type_code: "duolingo",
            name: { en: "Duolingo", ru: "Duolingo", uz: "Duolingo" },
            issued_at: "2026-02-01",
            expires_at: null,
            values: { score: 120 },
          },
        ],
      }),
    )
    renderAdmissionApp(<TestsBody />)
    expect((await screen.findAllByText("From my certificates")).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Other standard certificates")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull()
  })
})
