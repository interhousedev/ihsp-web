import type { KnowledgeEntry, KnowledgeEntryInput, KnowledgeEntryPatch } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { knowledgeEntries } from "../fixtures/admin-knowledge"
import { ids } from "../fixtures/world"
import { apiUrl, matches, nextId, noContent, notFound, param, problem, query, readJson } from "./utils"

let entries: KnowledgeEntry[] = structuredClone(knowledgeEntries)

export function resetAdminKnowledge(): void {
  entries = structuredClone(knowledgeEntries)
}

const keyTaken = () => problem(409, "knowledge_key_taken", "Key taken", { messageKey: "knowledge-key-taken" })
const taken = (key: string, exceptId?: string) =>
  entries.some((e) => e.id !== exceptId && e.key.toLowerCase() === key.toLowerCase())

/** `/v1/admin/knowledge`: list with `q` and `tags`, create, read, patch and delete; a duplicate key is a 409. */
export const adminKnowledgeHandlers = [
  http.get(apiUrl("/v1/admin/knowledge"), ({ request }) => {
    const search = query(request)
    const q = search.get("q")
    const tags = search.getAll("tags")
    const limit = Number(search.get("limit") ?? 50) || 50
    const offset = Number(search.get("offset") ?? 0) || 0
    const found = entries.filter(
      (e) => (!q || matches(`${e.key} ${e.title ?? ""} ${e.value}`, q)) && tags.every((tag) => e.tags.includes(tag)),
    )
    return HttpResponse.json({ items: found.slice(offset, offset + limit), total: found.length, limit, offset })
  }),
  http.post(apiUrl("/v1/admin/knowledge"), async ({ request }) => {
    const body = await readJson<KnowledgeEntryInput>(request)
    if (!body.key || !body.value) return problem(422, "knowledge_invalid", "Invalid")
    if (taken(body.key)) return keyTaken()
    const now = new Date().toISOString()
    const entry: KnowledgeEntry = {
      id: nextId(91),
      key: body.key,
      title: body.title ?? null,
      value: body.value,
      tags: body.tags ?? [],
      author_id: ids.student,
      created_at: now,
      updated_at: now,
      score: null,
    }
    entries = [entry, ...entries]
    return HttpResponse.json(entry)
  }),
  http.get(apiUrl("/v1/admin/knowledge/:id"), ({ params }) => {
    const entry = entries.find((e) => e.id === param(params, "id"))
    return entry ? HttpResponse.json(entry) : notFound("Entry")
  }),
  http.patch(apiUrl("/v1/admin/knowledge/:id"), async ({ params, request }) => {
    const entry = entries.find((e) => e.id === param(params, "id"))
    if (!entry) return notFound("Entry")
    const body = await readJson<KnowledgeEntryPatch>(request)
    if (body.key && taken(body.key, entry.id)) return keyTaken()
    Object.assign(entry, {
      ...(body.key ? { key: body.key } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.value ? { value: body.value } : {}),
      ...(body.tags ? { tags: body.tags } : {}),
      updated_at: new Date().toISOString(),
    })
    return HttpResponse.json(entry)
  }),
  http.delete(apiUrl("/v1/admin/knowledge/:id"), ({ params }) => {
    const id = param(params, "id")
    if (!entries.some((e) => e.id === id)) return notFound("Entry")
    entries = entries.filter((e) => e.id !== id)
    return noContent()
  }),
]
