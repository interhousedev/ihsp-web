// Admin — server-to-server migration: queue it, follow its steps, roll it back.

import type { components } from "../generated/openapi"
import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

export type MigrationStep = components["schemas"]["MigrationStep"]
/** `phase`: idle, queued, running, completed, failed or cancelling; anything but idle keeps the platform read-only. */
export type MigrationStatus = components["schemas"]["MigrationStatusResponse"]
/** Step-up `otp_code` is required. */
export type StartMigrationBody = components["schemas"]["StartMigrationBody"]
export type RollbackMigrationBody = components["schemas"]["RollbackBody"]

/** GET /v1/admin/migration — admin. */
export function getAdminMigration(opts?: RequestOptions): Promise<MigrationStatus> {
  return api.get<MigrationStatus>("/v1/admin/migration", opts)
}
export const getAdminMigrationQuery = () =>
  queryOptions({ queryKey: keys.admin.migration(), queryFn: ({ signal }) => getAdminMigration({ signal }) })

/** POST /v1/admin/migration/start — admin + step-up; `admin/migration-not-allowed`, `admin/migration-invalid-input`, `admin/migration-not-configured`. */
export function postAdminMigrationStart(body: StartMigrationBody, opts?: RequestOptions): Promise<MigrationStatus> {
  return api.post<MigrationStatus>("/v1/admin/migration/start", body, opts)
}

/** POST /v1/admin/migration/rollback — admin + step-up; leaves maintenance mode, the source data was never touched. */
export function postAdminMigrationRollback(
  body: RollbackMigrationBody,
  opts?: RequestOptions,
): Promise<MigrationStatus> {
  return api.post<MigrationStatus>("/v1/admin/migration/rollback", body, opts)
}
