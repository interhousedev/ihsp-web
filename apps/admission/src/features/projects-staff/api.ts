"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Helper, HelperIn } from "../projects/api"

const BASE = "/v1/admission/staff/project-helpers"
const KEY = ["admission", "staff-project-helpers"] as const

export const emptyHelper: HelperIn = {
  kind: "organization",
  name: "",
  description: { en: "", ru: "", uz: "" },
  tags: [],
  help_types: [],
  expertise_areas: [],
  contacts: { email: "", phone: "", telegram: "", website: "" },
  city: "",
  active: true,
}

/** GET /staff/project-helpers: every helper, inactive ones included. */
export function useStaffHelpers() {
  return useQuery({
    queryKey: [...KEY, "list"] as const,
    queryFn: ({ signal }) => getApiClient().get<{ items: Helper[] }>(BASE, { signal }),
  })
}

export function useStaffHelperMutations() {
  const client = useQueryClient()
  const done = () => client.invalidateQueries({ queryKey: KEY })
  const create = useMutation({
    mutationFn: (body: HelperIn) => getApiClient().post<Helper>(BASE, body),
    onSuccess: done,
  })
  const update = useMutation({
    mutationFn: (v: { id: string; body: HelperIn }) =>
      getApiClient().put<Helper>(`${BASE}/${encodeURIComponent(v.id)}`, v.body),
    onSuccess: done,
  })
  const remove = useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/${encodeURIComponent(id)}`),
    onSuccess: done,
  })
  return { create, update, remove }
}
