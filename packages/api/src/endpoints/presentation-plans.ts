// Presentation plans (PLAN): a slide-by-slide outline the student edits and confirms before the deck is generated.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { ArtifactItem } from "../types/notebooks"

// TODO(contract): replace with generated
/** One planned slide: a title and its bullets. */
export type PlanSlide = { title: string; bullets: string[] }

// TODO(contract): replace with generated
/** `PresentationPlan`: the outline of a deck; `over_limit` plans must be trimmed before "Generate". */
export type PresentationPlan = {
  id: string
  notebook_id: string
  title: string
  slides: PlanSlide[]
  status: "draft" | "confirmed"
  /** The most slides a deck may have. */
  max_slides: number
  over_limit: boolean
  /** The deck made from the plan, after "Generate". */
  artifact_id: string | null
  created_at: string
  updated_at: string
}

// TODO(contract): replace with generated
export type PlanCreateBody = {
  prompt?: string | null
  source_ids?: string[] | null
  slide_count?: number | null
  format?: "presenter" | "detailed"
}
// TODO(contract): replace with generated
export type PlanUpdateBody = { title?: string | null; slides?: PlanSlide[] | null }
// TODO(contract): replace with generated
export type PlanConfirmResult = { plan: PresentationPlan; artifact: ArtifactItem }

export const planKeys = {
  detail: (notebookId: string, planId: string) => ["notebooks", notebookId, "presentation-plans", planId] as const,
}

/** POST /v1/notebooks/{id}/presentation-plans — `201`, a draft outline (the model writes it, the deck is not made). */
export function postPresentationPlan(
  notebookId: string,
  body: PlanCreateBody,
  opts?: RequestOptions,
): Promise<PresentationPlan> {
  return api.post<PresentationPlan>(`/v1/notebooks/${seg(notebookId)}/presentation-plans`, body, opts)
}

/** GET /v1/notebooks/{id}/presentation-plans/{pid} — the caller's plan; `404` otherwise. */
export function getPresentationPlan(
  notebookId: string,
  planId: string,
  opts?: RequestOptions,
): Promise<PresentationPlan> {
  return api.get<PresentationPlan>(`/v1/notebooks/${seg(notebookId)}/presentation-plans/${seg(planId)}`, opts)
}
export const getPresentationPlanQuery = (notebookId: string, planId: string) =>
  queryOptions({
    queryKey: planKeys.detail(notebookId, planId),
    queryFn: ({ signal }) => getPresentationPlan(notebookId, planId, { signal }),
  })

/** PATCH /v1/notebooks/{id}/presentation-plans/{pid} — replace the title and/or the whole outline; `409 notebooks/plan-confirmed`. */
export function patchPresentationPlan(
  notebookId: string,
  planId: string,
  body: PlanUpdateBody,
  opts?: RequestOptions,
): Promise<PresentationPlan> {
  return api.patch<PresentationPlan>(`/v1/notebooks/${seg(notebookId)}/presentation-plans/${seg(planId)}`, body, opts)
}

/**
 * POST /v1/notebooks/{id}/presentation-plans/{pid}/confirm — "Generate": `202`, the deck is queued.
 * `422 notebooks/plan-too-long` (params `count`, `max`), `409 notebooks/plan-confirmed`, and the Studio limits.
 */
export function confirmPresentationPlan(
  notebookId: string,
  planId: string,
  opts?: RequestOptions,
): Promise<PlanConfirmResult> {
  return api.post<PlanConfirmResult>(
    `/v1/notebooks/${seg(notebookId)}/presentation-plans/${seg(planId)}/confirm`,
    undefined,
    opts,
  )
}
