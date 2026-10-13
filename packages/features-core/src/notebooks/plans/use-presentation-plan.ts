"use client"

import {
  confirmPresentationPlan,
  getPresentationPlanQuery,
  keys,
  patchPresentationPlan,
  planKeys,
  postPresentationPlan,
  type PlanConfirmResult,
  type PlanCreateBody,
  type PlanUpdateBody,
  type PresentationPlan,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

/** One presentation plan (PLAN); disabled until there is an id. */
export function usePresentationPlan(notebookId: string, planId: string | null) {
  return useQuery({ ...getPresentationPlanQuery(notebookId, planId ?? ""), enabled: Boolean(planId) })
}

/** Asks the model for an outline; the new plan is put in the cache so the panel opens without a second request. */
export function useCreatePresentationPlan(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<PresentationPlan, unknown, PlanCreateBody>({
    mutationFn: (body) => postPresentationPlan(notebookId, body),
    onSuccess: (plan) => {
      queryClient.setQueryData(planKeys.detail(notebookId, plan.id), plan)
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
    },
  })
}

/** Saves the edited outline (title, slides in their new order). */
export function useSavePresentationPlan(notebookId: string, planId: string) {
  const queryClient = useQueryClient()
  return useMutation<PresentationPlan, unknown, PlanUpdateBody>({
    mutationFn: (body) => patchPresentationPlan(notebookId, planId, body),
    onSuccess: (plan) => queryClient.setQueryData(planKeys.detail(notebookId, plan.id), plan),
  })
}

/** "Generate": the deck is queued from the plan and appears in the Studio list. */
export function useConfirmPresentationPlan(notebookId: string, planId: string) {
  const queryClient = useQueryClient()
  return useMutation<PlanConfirmResult, unknown, void>({
    mutationFn: () => confirmPresentationPlan(notebookId, planId),
    onSuccess: ({ plan }) => {
      queryClient.setQueryData(planKeys.detail(notebookId, plan.id), plan)
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.artifacts(notebookId) })
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
    },
  })
}
