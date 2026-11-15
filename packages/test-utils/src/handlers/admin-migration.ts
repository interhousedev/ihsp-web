import type { Maintenance, MigrationStatus, RollbackMigrationBody, StartMigrationBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, problem, readJson } from "./utils"

const STEPS = [
  "stop_services",
  "dump_postgres",
  "snapshot_redis",
  "copy_objects",
  "copy_config",
  "copy_vault",
  "copy_backups",
  "transfer",
  "verify",
]

function seed(): MigrationStatus {
  return {
    configured: true,
    phase: "idle",
    migration_id: null,
    target_host: null,
    target_port: null,
    target_url: null,
    requested_at: null,
    updated_at: null,
    error: null,
    dry_run: false,
    stale: false,
    steps: STEPS.map((key) => ({ key, state: "pending" })),
  }
}

let status = seed()

/** Back to an idle platform (preload calls this after every test). */
export function resetAdminMigration(): void {
  status = seed()
}

/** Tests move the migration on, as the host runner would. */
export function setAdminMigration(next: Partial<MigrationStatus>): void {
  status = { ...status, ...next }
}

/**
 * `GET /v1/admin/migration`; `POST …/start` queues it (step-up code `0000` is wrong, a running migration answers
 * `admin/migration-not-allowed`); `POST …/rollback` goes back to idle. `GET /v1/public/maintenance` follows the phase.
 */
export const adminMigrationHandlers = [
  http.get(apiUrl("/v1/admin/migration"), () => HttpResponse.json(status)),
  http.post(apiUrl("/v1/admin/migration/start"), async ({ request }) => {
    const body = await readJson<StartMigrationBody>(request)
    if (body.otp_code === "0000") return problem(403, "id/step-up-invalid", "Wrong code")
    if (status.phase !== "idle") return problem(409, "admin/migration-not-allowed", "Not allowed")
    status = {
      ...seed(),
      phase: "queued",
      migration_id: "mig-1",
      target_host: body.target_host ?? null,
      target_port: body.target_port ?? 22,
      target_url: body.target_url ?? null,
      requested_at: "2026-11-15T10:00:00Z",
      updated_at: "2026-11-15T10:00:00Z",
    }
    return HttpResponse.json(status)
  }),
  http.post(apiUrl("/v1/admin/migration/rollback"), async ({ request }) => {
    const body = await readJson<RollbackMigrationBody>(request)
    if (body.otp_code === "0000") return problem(403, "id/step-up-invalid", "Wrong code")
    if (status.phase === "idle") return problem(409, "admin/migration-not-allowed", "Not allowed")
    status = seed()
    return HttpResponse.json(status)
  }),
  http.get(apiUrl("/v1/public/maintenance"), () => {
    const body: Maintenance = {
      active: status.phase !== "idle",
      moved: status.phase === "completed",
      since: status.requested_at,
      target_url: status.target_url,
    }
    return HttpResponse.json(body)
  }),
]
