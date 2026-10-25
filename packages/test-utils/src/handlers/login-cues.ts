import type { LoginCueBody, LoginCueBulkBody, LoginCueResponse, RegisterCueBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { loginCueGroups, loginCueNames, loginCues } from "../fixtures/login-cues"
import { registrationStart } from "../fixtures/registration"
import { apiUrl, noContent, notFound, problem, query, readJson } from "./utils"

function toResponse(body: LoginCueBody, id: string): LoginCueResponse {
  const group = loginCueGroups.find((item) => item.group_id === body.group_id)
  return {
    id,
    full_name: body.full_name,
    group_id: body.group_id,
    group_name: group?.name ?? "",
    login_masked: `•••••${body.emis_login.slice(-4)}`,
    created_at: "2026-10-07T05:12:00Z",
    consumed_at: null,
  }
}

/**
 * Login cues: staff lists (`/v1/admin/login-cues*`), the public name pick and its registration start.
 * Magic values: EMIS login `unknown` is `404` on resolve, password `bad-password` is `emis/auth-failed` on the cue start.
 */
export const loginCuesHandlers = [
  http.post(apiUrl("/v1/admin/login-cues/bulk"), async ({ request }) => {
    const body = await readJson<LoginCueBulkBody>(request)
    const created = (body.items ?? []).map((item, index) => toResponse(item, `cue-bulk-${index + 1}`))
    return HttpResponse.json({ created }, { status: 201 })
  }),
  http.get(apiUrl("/v1/admin/login-cues"), ({ request }) => {
    const groupId = query(request).get("group_id")
    return HttpResponse.json(groupId ? loginCues.filter((cue) => cue.group_id === groupId) : loginCues)
  }),
  http.post(apiUrl("/v1/admin/login-cues"), async ({ request }) => {
    const body = await readJson<LoginCueBody>(request)
    return HttpResponse.json(toResponse(body as LoginCueBody, "cue-new"), { status: 201 })
  }),
  http.delete(apiUrl("/v1/admin/login-cues/:cueId"), ({ params }) => {
    const found = loginCues.some((cue) => cue.id === params.cueId)
    return found ? noContent() : notFound("Login cue")
  }),
  http.get(apiUrl("/v1/id/login-cues/groups"), () => HttpResponse.json(loginCueGroups)),
  http.get(apiUrl("/v1/id/login-cues/groups/:groupId"), ({ params }) => {
    const names = loginCueNames[String(params.groupId)]
    return names ? HttpResponse.json(names) : notFound("Group")
  }),
  http.post(apiUrl("/v1/id/register/emis/cue"), async ({ request }) => {
    const body = await readJson<RegisterCueBody>(request)
    if (body.emis_password === "bad-password") {
      return problem(401, "emis/auth-failed", "EMIS rejected the credentials")
    }
    return HttpResponse.json(registrationStart)
  }),
  http.post(apiUrl("/v1/id/login/emis/resolve"), async ({ request }) => {
    const body = await readJson<{ emis_login?: string }>(request)
    if (body.emis_login === "unknown") return problem(404, "id/not-registered", "This EMIS login is not registered")
    return HttpResponse.json({ registered: true })
  }),
]
