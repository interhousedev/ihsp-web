// Academic — the student's own full EMIS sync (teachers, lessons with plans, marks).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

// TODO(contract): replace with generated
/** The student's last full sync; `detail` is the timetable outcome (`synced`, `no_term`, `emis_unavailable`, ...). */
export interface MeSyncStatus {
  status: "queued" | "running" | "done" | "failed"
  requested_at: string
  finished_at: string | null
  detail: string | null
}

/** GET /v1/me/sync — student; `null` before the first sync. */
export function getMeSync(opts?: RequestOptions): Promise<MeSyncStatus | null> {
  return api.get<MeSyncStatus | null>("/v1/me/sync", opts)
}
export const getMeSyncQuery = () =>
  queryOptions({
    queryKey: keys.me.sync(),
    queryFn: ({ signal }) => getMeSync({ signal }),
  })

/** POST /v1/me/sync — student; 202 with the queued state, `429 common/rate-limited` within ten minutes. */
export function postMeSync(opts?: RequestOptions): Promise<MeSyncStatus> {
  return api.post<MeSyncStatus>("/v1/me/sync", {}, opts)
}
