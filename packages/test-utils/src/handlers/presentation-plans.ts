import type { PlanCreateBody, PlanUpdateBody, PresentationPlan } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { artifactReport } from "../fixtures/notebooks"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, param, problem, readJson } from "./utils"

const PLAN_MAX_SLIDES = 18

let plans = new Map<string, PresentationPlan>()

/** Resets the in-memory presentation plans; called after every test by `preload.ts`. */
export function resetPresentationPlansState(): void {
  plans = new Map()
}

function draft(notebookId: string, body: Partial<PlanCreateBody>): PresentationPlan {
  const count = Math.max(1, Math.min(body.slide_count ?? 5, PLAN_MAX_SLIDES))
  return {
    id: nextId(0x61),
    notebook_id: notebookId,
    title: body.prompt?.trim() || "Photosynthesis",
    slides: Array.from({ length: count }, (_, index) => ({
      title: `Slide ${index + 1}`,
      bullets: ["First point", "Second point"],
    })),
    status: "draft",
    max_slides: PLAN_MAX_SLIDES,
    over_limit: false,
    artifact_id: null,
    created_at: FIXTURE_NOW,
    updated_at: FIXTURE_NOW,
  }
}

function missing(): Response {
  return problem(404, "notebooks/presentation-plan-not-found", "Presentation plan not found")
}

export const presentationPlansHandlers = [
  http.post(apiUrl("/v1/notebooks/:id/presentation-plans"), async ({ params, request }) => {
    const plan = draft(param(params, "id"), await readJson<PlanCreateBody>(request))
    plans.set(plan.id, plan)
    return HttpResponse.json(plan, { status: 201 })
  }),
  http.get(apiUrl("/v1/notebooks/:id/presentation-plans/:planId"), ({ params }) => {
    const plan = plans.get(param(params, "planId"))
    return plan ? HttpResponse.json(plan) : missing()
  }),
  http.patch(apiUrl("/v1/notebooks/:id/presentation-plans/:planId"), async ({ params, request }) => {
    const plan = plans.get(param(params, "planId"))
    if (!plan) return missing()
    if (plan.status === "confirmed") return problem(409, "notebooks/plan-confirmed", "The plan is already confirmed")
    const body = await readJson<PlanUpdateBody>(request)
    const slides = body.slides ?? plan.slides
    const next: PresentationPlan = {
      ...plan,
      title: body.title ?? plan.title,
      slides,
      over_limit: slides.length > plan.max_slides,
    }
    plans.set(next.id, next)
    return HttpResponse.json(next)
  }),
  http.post(apiUrl("/v1/notebooks/:id/presentation-plans/:planId/confirm"), ({ params }) => {
    const plan = plans.get(param(params, "planId"))
    if (!plan) return missing()
    if (plan.over_limit) {
      return problem(422, "notebooks/plan-too-long", "The plan has too many slides", {
        params: { count: plan.slides.length, max: plan.max_slides },
      })
    }
    const artifact = { ...artifactReport, id: nextId(0x62), kind: "slides" as const, title: plan.title }
    const confirmed: PresentationPlan = { ...plan, status: "confirmed", artifact_id: artifact.id }
    plans.set(confirmed.id, confirmed)
    return HttpResponse.json({ plan: confirmed, artifact }, { status: 202 })
  }),
]
