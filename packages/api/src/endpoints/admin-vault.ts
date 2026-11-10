// Admin — the secrets vault: whether it is sealed and entering one key share at a time.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, type RequestOptions } from "../query"

/** `progress` of `threshold` key shares are entered; `shares` is how many exist in total. */
export type VaultStatus = {
  sealed: boolean
  progress: number
  threshold: number
  shares: number
}

/** The key share is never kept after the request. */
export type VaultUnsealBody = {
  key: string
}

/** GET /v1/admin/vault/status — admin. */
export function getAdminVaultStatus(opts?: RequestOptions): Promise<VaultStatus> {
  return api.get<VaultStatus>("/v1/admin/vault/status", opts)
}
export const getAdminVaultStatusQuery = () =>
  queryOptions({ queryKey: keys.admin.vaultStatus(), queryFn: ({ signal }) => getAdminVaultStatus({ signal }) })

/** POST /v1/admin/vault/unseal — admin; enters one key share, `id/vault-key-rejected` or `id/vault-unavailable` on failure. */
export function postAdminVaultUnseal(body: VaultUnsealBody, opts?: RequestOptions): Promise<VaultStatus> {
  return api.post<VaultStatus>("/v1/admin/vault/unseal", body, opts)
}
