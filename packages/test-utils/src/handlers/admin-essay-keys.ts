import type { EssayKeysStatus } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl } from "./utils"

function seed(): EssayKeysStatus {
  return {
    students_with_keys: 12,
    generation: 1,
    exported_at: null,
    exported_by: null,
    rotation: { state: "idle", total: 0, done: 0, unreadable: 0, started_at: null, finished_at: null },
  }
}

let status = seed()

/** Back to generation 1 with no backup taken (preload calls this after every test). */
export function resetAdminEssayKeys(): void {
  status = seed()
}

/**
 * `GET /v1/admin/essay-keys/status`; `POST backup` returns a file once per generation, `restore` restores nothing,
 * `rotate` starts a rotation.
 */
export const adminEssayKeysHandlers = [
  http.get(apiUrl("/v1/admin/essay-keys/status"), () => HttpResponse.json(status)),
  http.post(apiUrl("/v1/admin/essay-keys/backup"), () => {
    status = { ...status, exported_at: "2026-01-01T00:00:00Z", exported_by: "admin" }
    return HttpResponse.json(
      { format: "ihsp-essay-keys-backup", version: 1, generation: status.generation },
      { headers: { "Content-Disposition": 'attachment; filename="essay-keys-g1.json"' } },
    )
  }),
  http.post(apiUrl("/v1/admin/essay-keys/restore"), () =>
    HttpResponse.json({ restored: 0, skipped: status.students_with_keys, conflicts: [] }),
  ),
  http.post(apiUrl("/v1/admin/essay-keys/rotate"), () => {
    status = { ...status, rotation: { ...status.rotation, state: "running", started_at: "2026-01-01T00:00:00Z" } }
    return HttpResponse.json(status, { status: 202 })
  }),
]
