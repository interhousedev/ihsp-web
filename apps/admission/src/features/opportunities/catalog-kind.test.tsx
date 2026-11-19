import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Opportunity, Taxonomy } from "./api"
import { CatalogBody } from "./components/catalog-page"
import { SubmitDialog } from "./components/submit-dialog"

const BASE = "/v1/admission/opportunities"

const taxonomy: Taxonomy = {
  can_moderate: false,
  fields: [
    {
      id: "f1",
      name: { en: "STEM" },
      subfields: [{ id: "sf1", name: { en: "Mathematics" }, subjects: [{ id: "s1", name: { en: "Algebra" } }] }],
    },
  ],
}

const item = (id: string, title: string, forYou: boolean): Opportunity => ({
  next_deadline: null,
  id,
  fields: {
    kind: "program",
    title,
    subject_ids: ["s1"],
    study_field_ids: ["sf-cs"],
    grades: [11],
    registration_deadlines: [],
    exam_dates: [],
    last_year_dates: [],
    materials: [],
  } as unknown as Opportunity["fields"],
  archived: false,
  comment_count: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  lock_version: 0,
  upcoming: [],
  for_you: forYou,
})

function mockCatalog(sort: string, queries: URLSearchParams[] = []) {
  server.use(
    http.get(apiUrl(`${BASE}/taxonomy`), () => HttpResponse.json(taxonomy)),
    http.get(apiUrl(`${BASE}/plan`), () =>
      HttpResponse.json({ entries: [], opportunities: [], analytics: {}, deadlines: [] }),
    ),
    http.get(apiUrl("/v1/admission/career"), () =>
      HttpResponse.json({ study_focus: { field_ids: ["sf-cs"], labels: ["Computer Science"] } }),
    ),
    http.get(apiUrl(BASE), ({ request }) => {
      queries.push(new URL(request.url).searchParams)
      return HttpResponse.json({
        items: [item("o1", "Summer CS", true), item("o2", "Plain program", false)],
        total: 2,
        page: 1,
        size: 200,
        sort,
      })
    }),
  )
}

describe("catalog categories and relevance", () => {
  test("a saved opportunity adds the Open my plan next step", async () => {
    mockCatalog("title")
    server.use(
      http.get(apiUrl(`${BASE}/plan`), () =>
        HttpResponse.json({ entries: [{ opportunity_id: "o1" }], opportunities: [], analytics: {}, deadlines: [] }),
      ),
    )
    renderAdmissionApp(<CatalogBody />, {
      route: "/opportunities/",
      messages: { opportunities: { openPlan: "Open my plan", nextPlanHint: "Plan" } },
    })
    await screen.findByText("Summer CS")
    const link = await screen.findByRole("link", { name: /Open my plan/ })
    expect(link.getAttribute("href")).toBe("/plan?view=saved")
  })

  test("?kind= preselects the category and filters the request", async () => {
    const queries: URLSearchParams[] = []
    mockCatalog("title", queries)
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/?kind=program" })
    expect(await screen.findByText("Summer CS")).toBeTruthy()
    expect(queries.every((q) => q.get("kind") === "program")).toBe(true)
    // ADM-IDEAS-1: one kind row only, one selected tab, and no scholarships/exam kinds.
    expect(screen.getAllByRole("tab").filter((tab) => tab.getAttribute("aria-selected") === "true")).toHaveLength(1)
    expect(screen.getAllByRole("tab")).toHaveLength(6)
    expect(screen.getByRole("link", { name: "Scholarships" }).getAttribute("href")).toBe("/opportunities/scholarships")
  })

  test("choosing a category writes ?kind=", async () => {
    mockCatalog("title")
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/" })
    await screen.findByText("Summer CS")
    const tabs = screen.getAllByRole("tab")
    // ADM-IDEAS-2: all, course, certification, research, event, program
    fireEvent.click(tabs[4]!)
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/opportunities/?kind=event"))
  })

  test("ADM-IDEAS-3: filters sit behind a Filters button on phones and Change stays with its text", async () => {
    mockCatalog("relevance")
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/" })
    await screen.findByText("Summer CS")
    const toggle = screen.getAllByRole("button", { name: "Filters" })[0]!
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("link", { name: "Change" }).parentElement?.className).toContain("whitespace-nowrap")
  })

  test("relevance order shows the student's fields and a link to change them; for-you items get a badge", async () => {
    mockCatalog("relevance")
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/" })
    expect(await screen.findByText(/Sorted by your field: Computer Science/)).toBeTruthy()
    const change = screen.getByRole("link", { name: "Change" })
    expect(change.getAttribute("href")).toBe("/career?tab=field")
    expect(screen.getAllByText("For you")).toHaveLength(1)
  })

  test("no banner under title order", async () => {
    mockCatalog("title")
    renderAdmissionApp(<CatalogBody />, { route: "/opportunities/" })
    await screen.findByText("Summer CS")
    expect(screen.queryByText(/Sorted by your field/)).toBeNull()
  })
})

describe("submit dialog", () => {
  test("sends the study fields and the Markdown description", async () => {
    let body: { fields: { study_field_ids?: string[]; subject_ids?: string[] } } | undefined
    server.use(
      http.get(apiUrl(`${BASE}/taxonomy`), () => HttpResponse.json(taxonomy)),
      http.get(apiUrl("/v1/admission/orgs"), () => HttpResponse.json({ items: [], can_moderate: false })),
      http.get(apiUrl("/v1/admission/catalog/study-fields"), () =>
        HttpResponse.json([{ id: "g1", label: "Computing", items: [{ id: "sf-cs", label: "Computer Science" }] }]),
      ),
      http.post(apiUrl(`${BASE}/submissions`), async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({ id: "sub1" })
      }),
    )
    renderAdmissionApp(<SubmitDialog open onOpenChange={() => undefined} target={item("o1", "Summer CS", false)} />)
    expect(await screen.findByRole("button", { name: /Computer Science/ })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /Send/ }))
    await waitFor(() => expect(body?.fields.study_field_ids).toEqual(["sf-cs"]))
    expect(body?.fields.subject_ids).toEqual(["s1"])
  })
})
