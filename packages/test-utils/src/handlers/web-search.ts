import type { DiscoverBody, WebQuota } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { webQuota } from "../fixtures/ai"
import { discoverDeepResponse, discoverResponse } from "../fixtures/notebooks"
import { apiUrl, notFound, param, problem, readJson } from "./utils"

// In-memory web search quota shared by the assistant, the notebook chat and Discover. Every search with
// `web_search: true` (or a Discover run) spends from it; `setWebQuota` changes the starting state of a test.

let quota: WebQuota = { ...webQuota }

/** Replaces the quota (tests): `webQuotaDisabled`, `webQuotaSpent` or any other state. */
export function setWebQuota(next: WebQuota): void {
  quota = { ...next }
}

/** Puts the quota back to "enabled, 6 of 10 used"; called after every test by `preload.ts`. */
export function resetWebSearchState(): void {
  quota = { ...webQuota }
}

/** The current quota. */
export function currentWebQuota(): WebQuota {
  return quota
}

/** `404 web-search/disabled` or `429 web-search/quota-exceeded` when a search of `cost` is not possible, else spends it. */
export function spendWebSearch(cost = 1): Response | null {
  if (!quota.enabled) return problem(404, "web-search/disabled", "Web search is turned off")
  if (quota.remaining !== null && quota.remaining < cost) {
    return problem(429, "web-search/quota-exceeded", "No web searches left today", {
      params: { limit: quota.limit, left: quota.remaining, needed: cost, resets_at: quota.resets_at },
    })
  }
  quota = { ...quota, used: quota.used + cost, remaining: quota.remaining === null ? null : quota.remaining - cost }
  return null
}

export const webSearchHandlers = [
  http.get(apiUrl("/v1/ai/web-search"), () => HttpResponse.json(quota)),
  http.post(apiUrl("/v1/notebooks/:id/discover"), async ({ params, request }) => {
    if (!param(params, "id")) return notFound("Notebook")
    const body = await readJson<DiscoverBody>(request)
    if (!body.query || body.query.trim().length < 2) {
      return problem(422, "common/validation-failed", "The query is too short")
    }
    const deep = body.mode === "deep"
    const refused = spendWebSearch(deep ? quota.deep_cost : 1)
    if (refused) return refused
    return HttpResponse.json({ ...(deep ? discoverDeepResponse : discoverResponse), quota })
  }),
]
