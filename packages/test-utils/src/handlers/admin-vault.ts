import type { VaultStatus, VaultUnsealBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { apiUrl, problem, readJson } from "./utils"

function seed(): VaultStatus {
  return { sealed: true, progress: 0, threshold: 3, shares: 5 }
}

let status = seed()

/** Back to a sealed vault with no shares entered (preload calls this after every test). */
export function resetAdminVault(): void {
  status = seed()
}

/**
 * `GET /v1/admin/vault/status`; `POST /v1/admin/vault/unseal` counts one share. The key `rejected` answers
 * `id/vault-key-rejected` (422) and `unavailable` answers `id/vault-unavailable` (503).
 */
export const adminVaultHandlers = [
  http.get(apiUrl("/v1/admin/vault/status"), () => HttpResponse.json(status)),
  http.post(apiUrl("/v1/admin/vault/unseal"), async ({ request }) => {
    const body = await readJson<VaultUnsealBody>(request)
    if (body.key === "rejected") return problem(422, "id/vault-key-rejected", "Vault key rejected")
    if (body.key === "unavailable") return problem(503, "id/vault-unavailable", "Vault unavailable")
    const progress = Math.min(status.progress + 1, status.threshold)
    status = { ...status, progress, sealed: progress < status.threshold }
    return HttpResponse.json(status)
  }),
]
