import type {
  AiAccessBody,
  AiAccessItem,
  ExtensionBody,
  ExtensionItem,
  LimitItem,
  LimitsBody,
  LimitsResponse,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { adminExtensions, adminLimits, adminStudents, usageReport } from "../fixtures/admin-ai"
import { apiUrl, param, problem, query, readJson } from "./utils"

// In-memory state of the Limits & usage page: the limits in force and the per-user extensions. `resetAdminAiState`
// puts them back to the fixtures after every test (see `preload.ts`).

let limits: LimitItem[] = structuredClone(adminLimits)
let extensions: ExtensionItem[] = structuredClone(adminExtensions)

export function resetAdminAiState(): void {
  limits = structuredClone(adminLimits)
  extensions = structuredClone(adminExtensions)
  access.clear()
}

export const adminAiHandlers = [
  http.get(apiUrl("/v1/admin/ai/limits"), () => HttpResponse.json({ limits } satisfies LimitsResponse)),
  http.put(apiUrl("/v1/admin/ai/limits"), async ({ request }) => {
    const body = await readJson<LimitsBody>(request)
    for (const [key, value] of Object.entries(body.limits ?? {})) {
      const item = limits.find((candidate) => candidate.key === key)
      if (!item) return problem(422, "admin/limit-invalid", "Invalid limit value.", { params: { field: key } })
      if (value === null) {
        item.value = item.default
        item.overridden = false
      } else if (value < item.minimum || value > item.maximum) {
        return problem(422, "admin/limit-invalid", "Invalid limit value.", { params: { field: key } })
      } else {
        item.value = value
        item.overridden = value !== item.default
      }
    }
    return HttpResponse.json({ limits } satisfies LimitsResponse)
  }),
  http.get(apiUrl("/v1/admin/ai/usage"), ({ request }) => {
    const groupBy = query(request).get("group_by") ?? "day"
    return HttpResponse.json(usageReport(groupBy as Parameters<typeof usageReport>[0]))
  }),
  http.get(apiUrl("/v1/admin/ai/limit-extensions/students"), ({ request }) => {
    const search = (query(request).get("q") ?? "").toLowerCase()
    const items = adminStudents.filter((student) => student.name.toLowerCase().includes(search))
    return HttpResponse.json({ items })
  }),
  http.get(apiUrl("/v1/admin/ai/limit-extensions"), ({ request }) => {
    const userId = query(request).get("user_id")
    return HttpResponse.json({ items: userId ? extensions.filter((item) => item.user_id === userId) : extensions })
  }),
  http.put(apiUrl("/v1/admin/ai/limit-extensions/:id"), async ({ params, request }) => {
    const userId = param(params, "id")
    const student = adminStudents.find((candidate) => candidate.id === userId)
    if (!student) return problem(404, "admin/limit-user-not-found", "Student not found.")
    const body = await readJson<ExtensionBody>(request)
    const item: ExtensionItem = {
      user_id: userId,
      user_name: student.name,
      login: student.login,
      multiplier: body.multiplier ?? null,
      values: body.values ?? {},
      expires_on: body.expires_on ?? null,
      note: body.note ?? "",
      active: true,
      updated_at: "2026-10-07T09:00:00Z",
    }
    extensions = [...extensions.filter((candidate) => candidate.user_id !== userId), item]
    return HttpResponse.json(item)
  }),
  http.delete(apiUrl("/v1/admin/ai/limit-extensions/:id"), ({ params }) => {
    const userId = param(params, "id")
    extensions = extensions.filter((item) => item.user_id !== userId)
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(apiUrl("/v1/admin/ai/users/:id/access"), ({ params }) => {
    const userId = param(params, "id")
    return HttpResponse.json(accessOf(userId) satisfies AiAccessItem)
  }),
  http.put(apiUrl("/v1/admin/ai/users/:id/access"), async ({ params, request }) => {
    const userId = param(params, "id")
    const body = await readJson<Partial<AiAccessBody>>(request)
    access.set(userId, {
      ai_chat_blocked: body.ai_chat_blocked ?? false,
      ai_notebooks_blocked: body.ai_notebooks_blocked ?? false,
    })
    return HttpResponse.json(accessOf(userId) satisfies AiAccessItem)
  }),
]

// Revoked AI scopes per user (absent means none revoked); reset with the other state.
const access = new Map<string, AiAccessBody>()

function accessOf(userId: string): AiAccessItem {
  const found = access.get(userId)
  return {
    user_id: userId,
    ai_chat_blocked: found?.ai_chat_blocked ?? false,
    ai_notebooks_blocked: found?.ai_notebooks_blocked ?? false,
  }
}
