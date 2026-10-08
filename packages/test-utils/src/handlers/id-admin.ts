import type {
  AdminUser,
  BlockUserBody,
  MailSuspendBody,
  OauthClientVerifyBody,
  Role,
  TeacherCreateBody,
  TeacherPatchBody,
  UserRolesBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { auditItems } from "../fixtures/id"
import {
  adminTeacherUser,
  adminTeachers,
  adminUserDetail,
  adminUsers,
  oauthClients,
  resetPasswordResponse,
  teacherActivationUrl,
} from "../fixtures/id-admin"
import { apiUrl, matches, nextId, noContent, notFound, paginate, param, query, readJson } from "./utils"

function findUser(id: string): AdminUser | undefined {
  return [...adminUsers, ...adminTeachers].find((user) => user.id === id)
}

function filterUsers(users: AdminUser[], request: Request): AdminUser[] {
  const search = query(request)
  const needle = search.get("query")
  const role = search.get("role")
  const status = search.get("status")
  return users.filter(
    (user) =>
      (matches(user.login, needle) || matches(`${user.first_name} ${user.last_name}`, needle)) &&
      (!role || user.roles.includes(role as Role)) &&
      (!status || user.status === status),
  )
}

export const idAdminHandlers = [
  http.get(apiUrl("/v1/admin/users"), ({ request }) =>
    HttpResponse.json(paginate(filterUsers(adminUsers, request), request)),
  ),
  http.get(apiUrl("/v1/admin/users/:id"), ({ params }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    return HttpResponse.json({ ...adminUserDetail, ...user })
  }),
  http.post(apiUrl("/v1/admin/users/:id/block"), async ({ params, request }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    await readJson<BlockUserBody>(request)
    return HttpResponse.json({ ...user, status: "blocked" })
  }),
  http.post(apiUrl("/v1/admin/users/:id/unblock"), ({ params }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    return HttpResponse.json({ ...user, status: "active" })
  }),
  http.post(apiUrl("/v1/admin/users/:id/roles"), async ({ params, request }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    const body = await readJson<UserRolesBody>(request)
    const roles = user.roles.filter((role) => !(body.revoke ?? []).includes(role))
    for (const role of body.grant ?? []) if (!roles.includes(role)) roles.push(role)
    return HttpResponse.json({ ...user, roles })
  }),
  http.post(apiUrl("/v1/admin/users/:id/sessions/revoke"), () => noContent()),
  http.post(apiUrl("/v1/admin/users/:id/reset-password"), () => HttpResponse.json(resetPasswordResponse)),
  http.post(apiUrl("/v1/admin/users/:id/reset-otp"), () => noContent()),
  http.post(apiUrl("/v1/admin/users/:id/mail/suspend"), async ({ params, request }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    await readJson<MailSuspendBody>(request)
    return HttpResponse.json({ ...user, mail_suspended: true })
  }),
  http.post(apiUrl("/v1/admin/users/:id/mail/resume"), ({ params }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("User")
    return HttpResponse.json({ ...user, mail_suspended: false })
  }),

  http.get(apiUrl("/v1/admin/teachers"), ({ request }) =>
    HttpResponse.json(paginate(filterUsers(adminTeachers, request), request)),
  ),
  http.post(apiUrl("/v1/admin/teachers"), async ({ request }) => {
    const body = await readJson<TeacherCreateBody>(request)
    const user: AdminUser = {
      ...adminTeacherUser,
      id: nextId(1),
      login: `${(body.last_name ?? "teacher").toLowerCase()}.${(body.first_name ?? "new").toLowerCase()}`,
      first_name: body.first_name ?? "New",
      last_name: body.last_name ?? "Teacher",
      middle_name: body.middle_name ?? null,
      status: "pending_activation",
      recovery_email: body.email ?? null,
      created_at: "2026-10-07T05:12:00Z",
      last_login_at: null,
    }
    return HttpResponse.json({ user, activation_url: teacherActivationUrl })
  }),
  http.patch(apiUrl("/v1/admin/teachers/:id"), async ({ params, request }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("Teacher")
    const body = await readJson<TeacherPatchBody>(request)
    return HttpResponse.json({
      ...user,
      first_name: body.first_name ?? user.first_name,
      last_name: body.last_name ?? user.last_name,
      middle_name: body.middle_name ?? user.middle_name,
      recovery_email: body.email ?? user.recovery_email,
    })
  }),
  http.post(apiUrl("/v1/admin/teachers/:id/deactivate"), ({ params }) => {
    const user = findUser(param(params, "id"))
    if (!user) return notFound("Teacher")
    return HttpResponse.json({ ...user, status: "deactivated" })
  }),

  http.get(apiUrl("/v1/admin/audit"), ({ request }) => {
    const type = query(request).get("type")
    const items = auditItems.filter((item) => !type || item.type === type)
    return HttpResponse.json(paginate(items, request))
  }),
  http.get(apiUrl("/v1/admin/oauth-clients"), () => HttpResponse.json(oauthClients)),
  http.post(apiUrl("/v1/admin/oauth-clients/:clientId/verify"), async ({ params, request }) => {
    const client = oauthClients.find((item) => item.client_id === param(params, "clientId"))
    if (!client) return notFound("OAuth client")
    const body = await readJson<OauthClientVerifyBody>(request)
    return HttpResponse.json({ ...client, verified: body.verified ?? true })
  }),
]
