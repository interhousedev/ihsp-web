"use client"

import { api } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"

/**
 * Hand-typed against the "My group" contract (GET /v1/me/group, GET /v1/me/group/rankings) until the generated client
 * carries these fields. Every new field is optional here so an older backend still renders the base page.
 */
export type StandingPerson = { id: string; full_name: string; photo_url: string | null }

export type TopRow = {
  rank: number
  student_id: string
  full_name: string
  photo_url: string | null
  value: number | null
  is_me: boolean
}

export type Place = { place: number; total: number }
export type ScopeRanks = { gpa: Place | null; attendance: Place | null }
export type RankScope = "course" | "lyceum"
export type RankMetric = "gpa" | "attendance"

export type GroupStanding = {
  group?: { id: string; name: string; course: number | null }
  curator?: StandingPerson | null
  head_student?: unknown
  members_count?: number
  top_by_grade?: TopRow[]
  top_by_attendance?: TopRow[]
  ranks?: { course: ScopeRanks; lyceum: ScopeRanks }
}

export type GroupRankingItem = {
  place: number
  group_id: string
  group_name: string
  course: number | null
  value: number | null
  members_count: number
  is_mine: boolean
}

export const NO_GROUP = "academic/no-group"

export function useGroupRankings(scope: RankScope, metric: RankMetric, enabled: boolean) {
  return useQuery({
    queryKey: ["me", "group", "rankings", scope, metric],
    queryFn: () => api.get<{ items: GroupRankingItem[] }>("/v1/me/group/rankings", { query: { scope, metric } }),
    enabled,
  })
}
