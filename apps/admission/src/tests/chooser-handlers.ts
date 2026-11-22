import { apiUrl, server } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import type { Estimate, Institution, ListEntry } from "../features/chooser/types"

export function institution(overrides: Partial<Institution> = {}): Institution {
  return {
    next_deadline: null,
    id: "i1",
    slug: "uni-one",
    name: "Uni One",
    country: "Testland",
    city: "Testville",
    verified: true,
    facts: {},
    cover_url: null,
    logo_url: null,
    website_url: null,
    coa_total: "40000",
    coa_currency: "USD",
    cost_after_aid: null,
    aid_basis: null,
    merit_available: null,
    scholarship_count: 0,
    aliases: [],
    deadlines: [],
    sources: [],
    highlights: [],
    focuses: [],
    details: [],
    factors: [],
    name_local: null,
    logo_zoom: 1,
    logo_fit: "circle",
    ...overrides,
  }
}

/** A school with details in several groups, admission factors and a binding ED deadline. */
export function richInstitution(overrides: Partial<Institution> = {}): Institution {
  return institution({
    id: "i2",
    name: "Rich University",
    details: [
      {
        key: "selectivity",
        label: "Selectivity",
        rows: [
          {
            key: "acceptance_rate",
            label: "Acceptance rate",
            kind: "range",
            value: { min: 4, max: 6 },
            value_text: "4-6%",
            source_url: "https://www.rich.edu/facts",
            year: 2025,
          },
        ],
      },
      {
        key: "costs",
        label: "Costs and aid",
        rows: [
          {
            key: "intl_coa_usd",
            label: "International cost of attendance",
            kind: "money",
            value: 90000,
            value_text: "$90 000",
            source_url: null,
            year: null,
          },
        ],
      },
    ],
    factors: [
      { key: "gpa", label: "GPA", importance: "very_important" },
      { key: "interview", label: "Interview", importance: "not_considered" },
    ],
    deadlines: [
      {
        plan: "ED",
        date: "2026-11-02",
        notify_by: null,
        cycle: "2026-27",
        label_short: "Early Decision · Nov 2",
        binding: true,
        time_zone: "America/New_York",
      },
    ],
    ...overrides,
  })
}

export function estimate(overrides: Partial<Estimate> = {}): Estimate {
  return {
    label: "target",
    low: null,
    high: null,
    range_visible: false,
    calibrated: false,
    label_overridden: false,
    verified: true,
    caveats: [],
    missing: [],
    method_version: "v1",
    sources: [],
    basis: {},
    ...overrides,
  }
}

export function listEntry(overrides: Partial<ListEntry> = {}): ListEntry {
  return {
    id: "e1",
    student_id: "s1",
    institution: institution(),
    round: "RD",
    status: "considering",
    bucket: "target",
    notes: null,
    label_override: null,
    override_note: null,
    affordability_status: "unknown",
    fee_status: "unpaid",
    affordability: null,
    estimate: estimate(),
    lock_version: 1,
    cycle: null,
    conflicts: [],
    ...overrides,
  }
}

/** Serves the catalog and the list; records every catalog request URL and every list POST body. */
export function mockChooser(options: { items?: Institution[]; list?: ListEntry[] } = {}) {
  const catalogRequests: URL[] = []
  const listPosts: unknown[] = []
  server.use(
    http.get(apiUrl("/v1/admission/catalog/institutions"), ({ request }) => {
      catalogRequests.push(new URL(request.url))
      return HttpResponse.json({ items: options.items ?? [], next_cursor: null })
    }),
    http.get(apiUrl("/v1/admission/catalog/institutions/:id"), ({ params }) => {
      const found = (options.items ?? []).find((item) => item.id === params.id)
      return found
        ? HttpResponse.json(found)
        : HttpResponse.json({ type: "not-found", title: "Not found", status: 404 }, { status: 404 })
    }),
    http.get(apiUrl("/v1/admission/catalog/facets"), () =>
      HttpResponse.json([
        { param: "country", label: "Country", kind: "select", options: [{ value: "Testland", label: "Testland" }] },
        { param: "setting", label: "Setting", kind: "select", options: [{ value: "urban", label: "Urban" }] },
        { param: "cycle", label: "Cycle", kind: "select", options: [{ value: "2026-27", label: "2026-27" }] },
      ]),
    ),
    http.get(apiUrl("/v1/admission/catalog/study-fields"), () =>
      HttpResponse.json([
        {
          id: "g1",
          label: "Sciences",
          items: [
            { id: "physics", label: "Physics" },
            { id: "biology", label: "Biology" },
          ],
        },
      ]),
    ),
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ options: { city_types: ["any"] } })),
    http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json(options.list ?? [])),
    http.get(apiUrl("/v1/admission/list/insights"), () =>
      HttpResponse.json({
        entries: [],
        balance: { reach: 0, target: 0, safety: 0, unlabelled: 0, status: "empty" },
      }),
    ),
    http.post(apiUrl("/v1/admission/list"), async ({ request }) => {
      listPosts.push(await request.json())
      return HttpResponse.json(listEntry(), { status: 201 })
    }),
  )
  return { catalogRequests, listPosts }
}
