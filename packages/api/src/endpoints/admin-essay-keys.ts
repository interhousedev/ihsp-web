// Admin — the admission essay encryption keys: status, the one-time backup, restore and rotation.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"
import type { components } from "../generated/openapi"

type Schemas = components["schemas"]

export type EssayKeysStatus = Schemas["EssayKeysStatusResponse"]
export type EssayKeysRotation = Schemas["RotationResponse"]
export type EssayKeysRestoreBody = Schemas["app__interfaces__http__v1__admin_users__essay_keys__schemas__RestoreBody"]
export type EssayKeysRestoreResult =
  Schemas["app__interfaces__http__v1__admin_users__essay_keys__schemas__RestoreResponse"]

/** The backup file as the server sent it: its content and the filename of `Content-Disposition`. */
export type EssayKeysBackupFile = { blob: Blob; filename: string }

const FALLBACK_FILENAME = "essay-keys-backup.json"

function filenameOf(disposition: string | null): string {
  if (!disposition) return FALLBACK_FILENAME
  const encoded = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(disposition)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim())
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/.exec(disposition)?.[1]
  return plain?.trim() || FALLBACK_FILENAME
}

/** GET /v1/admin/essay-keys/status */
export function getAdminEssayKeysStatus(opts?: RequestOptions): Promise<EssayKeysStatus> {
  return api.get<EssayKeysStatus>("/v1/admin/essay-keys/status", opts)
}
export const getAdminEssayKeysStatusQuery = () =>
  queryOptions({
    queryKey: keys.admin.essayKeys(),
    queryFn: ({ signal }) => getAdminEssayKeysStatus({ signal }),
  })

/** POST /v1/admin/essay-keys/backup — the passphrase-sealed backup; 409 `admission/essay_keys_backup_taken` after the first. */
export async function postAdminEssayKeysBackup(
  body: { passphrase: string },
  opts?: RequestOptions,
): Promise<EssayKeysBackupFile> {
  const response = await api.request<Response>({
    ...opts,
    method: "POST",
    path: "/v1/admin/essay-keys/backup",
    body,
    responseType: "stream",
  })
  return { blob: await response.blob(), filename: filenameOf(response.headers.get("content-disposition")) }
}

/** POST /v1/admin/essay-keys/restore — writes the keys missing from the vault; 422 `admission/essay_keys_backup_invalid`. */
export function postAdminEssayKeysRestore(
  body: EssayKeysRestoreBody,
  opts?: RequestOptions,
): Promise<EssayKeysRestoreResult> {
  return api.post<EssayKeysRestoreResult>("/v1/admin/essay-keys/restore", body, opts)
}

/** POST /v1/admin/essay-keys/rotate — 202; 409 `admission/essay_keys_rotation_running`. */
export function postAdminEssayKeysRotate(opts?: RequestOptions): Promise<EssayKeysStatus> {
  return api.post<EssayKeysStatus>("/v1/admin/essay-keys/rotate", undefined, opts)
}
