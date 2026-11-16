"use client"

import { getApiClient, seg } from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const MILESTONE_STATUSES = ["planned", "done", "dropped"] as const
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

/** Mirrors the goal-plan `MilestoneOut`; `due_month` is the first day of a month. */
export type Milestone = {
  id: string
  item_id: string | null
  title: string
  due_month: string | null
  target_value: string | null
  status: MilestoneStatus
  source: string
  sort_order: number
  lock_version: number
}

export type MilestoneInput = {
  title: string
  item_id?: string | null
  due_month?: string | null
  target_value?: number | null
  status?: MilestoneStatus
}

const KEY = ["admission", "goal-plan"] as const
const BASE = "/v1/admission/goal-plan"

export function useGoalPlan() {
  return useQuery({ queryKey: KEY, queryFn: () => getApiClient().get<{ items: Milestone[] }>(BASE) })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: KEY })
}

export function useCreateMilestone() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (body: MilestoneInput) => getApiClient().post<Milestone>(`${BASE}/milestones`, body),
    onSuccess: invalidate,
  })
}

export function usePatchMilestone() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<MilestoneInput> & { id: string; lock_version: number }) =>
      getApiClient().patch<Milestone>(`${BASE}/milestones/${seg(id)}`, body),
    onSettled: invalidate,
  })
}

export function useDeleteMilestone() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => getApiClient().delete<void>(`${BASE}/milestones/${seg(id)}`),
    onSuccess: invalidate,
  })
}

export type Suggestion = { title: string; item_id: string | null; due_month: string }

/** Proposals only; nothing is stored until the student accepts some and the whole plan is put. */
export function useSuggestMilestones() {
  return useMutation({
    mutationFn: () => getApiClient().post<{ items: Suggestion[] }>(`${BASE}/suggest`, {}),
  })
}

/** Replaces the whole plan in display order (at most 12). */
export function usePutGoalPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: MilestoneInput[] & { id?: string }[]) =>
      getApiClient().put<{ items: Milestone[] }>(BASE, { items }),
    onSuccess: (data) => qc.setQueryData(KEY, data),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
