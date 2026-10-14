import type { MeSyncStatus } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, problem } from "./utils"

let last: MeSyncStatus | null = null

/** Forget the last sync (preload calls this after every test). */
export function resetMeSyncState(): void {
  last = null
}

/**
 * `GET /v1/me/sync` answers the last sync (`null` before the first); `POST` queues one and answers 202, and a second
 * `POST` while the window is open answers `429 common/rate-limited` with `retry_after`, as the backend does.
 */
export const meSyncHandlers = [
  http.get(apiUrl("/v1/me/sync"), () => HttpResponse.json(last)),
  http.post(apiUrl("/v1/me/sync"), () => {
    if (last !== null) {
      return problem(429, "common/rate-limited", "Too many requests", { params: { retry_after: 540 } })
    }
    last = { status: "queued", requested_at: "2026-10-06T09:00:00Z", finished_at: null, detail: null }
    return HttpResponse.json(last, { status: 202 })
  }),
]
