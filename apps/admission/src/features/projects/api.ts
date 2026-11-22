"use client"

import { getApiClient } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const BASE = "/v1/admission/projects"
const KEY = ["admission", "projects"] as const

export const HELP_TAGS = [
  "website_tech",
  "business_growth",
  "pitching",
  "org_outreach",
  "fundraising",
  "product_dev",
] as const
export const HELP_TYPES = ["venue", "funding", "consultations", "expertise", "mentoring", "equipment_space"] as const
export const TEAMMATES = ["yes", "maybe", "no"] as const

export type HelpTag = (typeof HELP_TAGS)[number]
export type HelpType = (typeof HELP_TYPES)[number]
export type Teammates = (typeof TEAMMATES)[number]

export type Brief = {
  likes: string
  future_interest: string
  experience: string
  hours_per_day: number
  teammates: Teammates
  teammates_note: string
  network: string
  budget_min_usd: number
  budget_max_usd: number
}

export type Analog = { name: string; where: "uzbekistan" | "abroad"; url: string | null }

export type Project = {
  key: string
  title: string
  summary: string
  analogs: Analog[]
  challenges: string[]
  application_effect: string
  first_steps: string[]
  help_tags: string[]
}

export type ProjectRun = {
  id: string
  created_at: string
  search_used: boolean
  brief: Brief
  projects: Project[]
}

export type RunSummary = { id: string; created_at: string; count: number }
export type RunsOut = { latest: ProjectRun | null; history: RunSummary[] }

export type Locales = { en: string; ru: string; uz: string }
export type Contacts = { email: string; phone: string; telegram: string; website: string }
export type HelperIn = {
  kind: "person" | "organization"
  name: string
  description: Locales
  tags: string[]
  help_types: string[]
  expertise_areas: string[]
  contacts: Contacts
  city: string
  active: boolean
}
export type Helper = HelperIn & { id: string }

export const emptyBrief: Brief = {
  likes: "",
  future_interest: "",
  experience: "",
  hours_per_day: 2,
  teammates: "maybe",
  teammates_note: "",
  network: "",
  budget_min_usd: 0,
  budget_max_usd: 500,
}

/** GET /projects/ideas: the latest run and the short history. */
export function useProjectRuns() {
  return useQuery({
    queryKey: [...KEY, "runs"] as const,
    queryFn: ({ signal }) => getApiClient().get<RunsOut>(`${BASE}/ideas`, { signal }),
  })
}

/** GET /projects/ideas/{run_id}: one of the student's own runs. */
export function useProjectRun(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "run", id] as const,
    enabled: id !== null,
    queryFn: ({ signal }) =>
      getApiClient().get<ProjectRun>(`${BASE}/ideas/${encodeURIComponent(id ?? "")}`, { signal }),
  })
}

/** POST /projects/ideas: generates a run (can take 20 to 40 seconds while the model searches). */
export function useGenerateProjects() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (brief: Brief) => getApiClient().post<ProjectRun>(`${BASE}/ideas`, brief),
    onSuccess: () => client.invalidateQueries({ queryKey: [...KEY, "runs"] }),
  })
}

/** GET /projects/helpers?tag=..: the active helpers matching any of the tags. */
export function useProjectHelpers(tags: string[], enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "helpers", tags] as const,
    enabled,
    queryFn: ({ signal }) =>
      getApiClient().get<{ items: Helper[] }>(`${BASE}/helpers`, { query: { tag: tags }, signal }),
  })
}
