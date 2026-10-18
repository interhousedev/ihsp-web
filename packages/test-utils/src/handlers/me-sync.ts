import type { MeSyncStatus } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

let last: MeSyncStatus | null = null

/** Forget the last sync (preload calls this after every test). */
export function resetMeSyncState(): void {
  last = null
}

/** A sync record with sensible defaults; override what a test cares about. */
export function syncRecord(overrides: Partial<MeSyncStatus> = {}): MeSyncStatus {
  return {
    user_id: "00000000-0000-4000-8000-000000000001",
    status: "pending",
    attempts: 0,
    max_attempts: 6,
    requested_at: "2026-10-06T09:00:00Z",
    next_attempt_at: null,
    finished_at: null,
    last_error: null,
    subgroup: null,
    marks_count: null,
    ...overrides,
  }
}

/**
 * `GET /v1/me/sync` answers the job (`null` before the first); `POST` returns the job as pending, and
 * is idempotent: a job that is already pending, running or succeeded is answered unchanged.
 */
export const meSyncHandlers = [
  http.get(apiUrl("/v1/admin/sync/student-syncs"), () => HttpResponse.json([] as MeSyncStatus[])),
  http.get(apiUrl("/v1/me/sync"), () => HttpResponse.json(last)),
  http.post(apiUrl("/v1/me/sync"), () => {
    if (last === null || last.status === "failed") {
      last = syncRecord({ status: "pending", requested_at: "2026-10-06T09:00:00Z" })
    }
    return HttpResponse.json(last, { status: 202 })
  }),
]
