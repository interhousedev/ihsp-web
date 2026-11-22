"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/staff/catalog"

export type ScorecardSchool = {
  unitid: number
  name: string
  city: string | null
  state: string | null
  website_domain: string | null
  facts: Record<string, unknown>
}

/** GET /staff/catalog/scorecard/search: candidates by name or UNITID. */
export function useScorecardSearch(q: string) {
  const text = q.trim()
  return useQuery({
    queryKey: ["admission", "scorecard-search", text] as const,
    enabled: text.length >= 2 || /^\d+$/.test(text),
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: ScorecardSchool[] }>(`${BASE}/scorecard/search`, { query: { q: text }, signal }),
  })
}

/** POST /staff/catalog/institutions/{id}/scorecard: upsert the school's facts. */
export function useScorecardAttach() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; unitid: number }) =>
      getApiClient().post<ScorecardSchool>(`${BASE}/institutions/${encodeURIComponent(v.id)}/scorecard`, {
        unitid: v.unitid,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admission", "staff-institutions"] }),
  })
}
