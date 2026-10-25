// Admin — school knowledge base (`/v1/admin/knowledge`).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type {
  KnowledgeEntry,
  KnowledgeEntryInput,
  KnowledgeEntryPage,
  KnowledgeEntryPatch,
  KnowledgeParams,
} from "../types/admin-knowledge"

/** GET /v1/admin/knowledge — admin; entries by `q` (search) and `tags`, `limit` and `offset` page through them. */
export function getAdminKnowledge(params?: KnowledgeParams, opts?: RequestOptions): Promise<KnowledgeEntryPage> {
  return api.get<KnowledgeEntryPage>("/v1/admin/knowledge", { ...opts, query: params })
}
export const getAdminKnowledgeQuery = (params?: KnowledgeParams) =>
  queryOptions({
    queryKey: keys.admin.knowledge.list(params),
    queryFn: ({ signal }) => getAdminKnowledge(params, { signal }),
  })

/** GET /v1/admin/knowledge/{entry_id} — admin. */
export function getAdminKnowledgeEntry(entryId: string, opts?: RequestOptions): Promise<KnowledgeEntry> {
  return api.get<KnowledgeEntry>(`/v1/admin/knowledge/${seg(entryId)}`, opts)
}

/** POST /v1/admin/knowledge — admin; `409 knowledge_key_taken` when the key exists (keys ignore case). */
export function postAdminKnowledge(body: KnowledgeEntryInput, opts?: RequestOptions): Promise<KnowledgeEntry> {
  return api.post<KnowledgeEntry>("/v1/admin/knowledge", body, opts)
}

/** PATCH /v1/admin/knowledge/{entry_id} — admin; only the sent fields change. */
export function patchAdminKnowledge(
  entryId: string,
  body: KnowledgeEntryPatch,
  opts?: RequestOptions,
): Promise<KnowledgeEntry> {
  return api.patch<KnowledgeEntry>(`/v1/admin/knowledge/${seg(entryId)}`, body, opts)
}

/** DELETE /v1/admin/knowledge/{entry_id} — admin. */
export function deleteAdminKnowledge(entryId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/knowledge/${seg(entryId)}`, opts)
}
