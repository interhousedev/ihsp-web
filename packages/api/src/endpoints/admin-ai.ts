// Limits & usage (admin): runtime AI limits, per-user extensions and the usage report.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AiAccessBody,
  AiAccessItem,
  ExtensionBody,
  ExtensionItem,
  ExtensionsParams,
  ExtensionsResponse,
  LimitsBody,
  LimitsResponse,
  StudentsResponse,
  AdminUsageParams,
  UsageResponse,
} from "../types/admin-ai"

/** GET /v1/admin/ai/limits — admin. */
export function getAdminAiLimits(opts?: RequestOptions): Promise<LimitsResponse> {
  return api.get<LimitsResponse>("/v1/admin/ai/limits", opts)
}
export const getAdminAiLimitsQuery = () =>
  queryOptions({ queryKey: keys.admin.aiLimits(), queryFn: ({ signal }) => getAdminAiLimits({ signal }) })

/** PUT /v1/admin/ai/limits — admin; partial update, `null` resets a limit to its environment value. */
export function putAdminAiLimits(body: LimitsBody, opts?: RequestOptions): Promise<LimitsResponse> {
  return api.put<LimitsResponse>("/v1/admin/ai/limits", body, opts)
}

/** GET /v1/admin/ai/usage — admin; tokens, calls and cost of a date range, grouped. */
export function getAdminAiUsage(params?: AdminUsageParams, opts?: RequestOptions): Promise<UsageResponse> {
  return api.get<UsageResponse>("/v1/admin/ai/usage", { ...opts, query: params })
}
export const getAdminAiUsageQuery = (params?: AdminUsageParams) =>
  queryOptions({
    queryKey: keys.admin.aiUsage(params),
    queryFn: ({ signal }) => getAdminAiUsage(params, { signal }),
  })

/** GET /v1/admin/ai/limit-extensions — admin; every extension, or the one of a student. */
export function getAdminAiExtensions(params?: ExtensionsParams, opts?: RequestOptions): Promise<ExtensionsResponse> {
  return api.get<ExtensionsResponse>("/v1/admin/ai/limit-extensions", { ...opts, query: params })
}
export const getAdminAiExtensionsQuery = (params?: ExtensionsParams) =>
  queryOptions({
    queryKey: keys.admin.aiExtensions(params),
    queryFn: ({ signal }) => getAdminAiExtensions(params, { signal }),
  })

/** GET /v1/admin/ai/limit-extensions/students — admin; students whose name or login matches (2+ characters). */
export function getAdminAiStudents(q: string, opts?: RequestOptions): Promise<StudentsResponse> {
  return api.get<StudentsResponse>("/v1/admin/ai/limit-extensions/students", { ...opts, query: { q } })
}
export const getAdminAiStudentsQuery = (q: string) =>
  queryOptions({
    queryKey: keys.admin.aiStudents(q),
    queryFn: ({ signal }) => getAdminAiStudents(q, { signal }),
  })

/** GET /v1/admin/ai/users/{user_id}/access — admin; the chat and notebook AI revoked from a user. */
export function getAdminAiAccess(userId: string, opts?: RequestOptions): Promise<AiAccessItem> {
  return api.get<AiAccessItem>(`/v1/admin/ai/users/${seg(userId)}/access`, opts)
}
export const getAdminAiAccessQuery = (userId: string) =>
  queryOptions({
    queryKey: keys.admin.aiAccess(userId),
    queryFn: ({ signal }) => getAdminAiAccess(userId, { signal }),
  })

/** PUT /v1/admin/ai/users/{user_id}/access — admin; `true` revokes that scope (audited, 30 s to apply). */
export function putAdminAiAccess(userId: string, body: AiAccessBody, opts?: RequestOptions): Promise<AiAccessItem> {
  return api.put<AiAccessItem>(`/v1/admin/ai/users/${seg(userId)}/access`, body, opts)
}

/** PUT /v1/admin/ai/limit-extensions/{user_id} — admin; creates or replaces the extension of a student. */
export function putAdminAiExtension(
  userId: string,
  body: ExtensionBody,
  opts?: RequestOptions,
): Promise<ExtensionItem> {
  return api.put<ExtensionItem>(`/v1/admin/ai/limit-extensions/${seg(userId)}`, body, opts)
}

/** DELETE /v1/admin/ai/limit-extensions/{user_id} — admin; removes the extension of a student. */
export function deleteAdminAiExtension(userId: string, opts?: RequestOptions): Promise<void> {
  return api.delete<void>(`/v1/admin/ai/limit-extensions/${seg(userId)}`, opts)
}
