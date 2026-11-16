import { apiUrl, server } from "@ihsp/test-utils"
import { http, HttpResponse } from "msw"
import type { Estimate, Institution, ListEntry } from "../features/chooser/types"

export function institution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: "i1",
    slug: "uni-one",
    name: "Uni One",
    country: "Testland",
    city: "Testville",
    verified: true,
    facts: {},
    coa_total: "40000",
    coa_currency: "USD",
    aid_basis: null,
    merit_available: null,
    scholarship_count: 0,
    ...overrides,
  }
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
    method_version: null,
    sources: [],
    basis: null,
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
    affordability_status: null,
    affordability: null,
    estimate: estimate(),
    lock_version: 1,
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
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ options: { city_types: ["any"] } })),
    http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json(options.list ?? [])),
    http.post(apiUrl("/v1/admission/list"), async ({ request }) => {
      listPosts.push(await request.json())
      return HttpResponse.json(listEntry(), { status: 201 })
    }),
  )
  return { catalogRequests, listPosts }
}
