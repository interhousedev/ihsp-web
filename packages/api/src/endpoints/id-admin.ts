// Identity — administration (role: admin).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type { AuditItem } from "../types/id"
import type {
  AdminAuditParams,
  AdminTeachersParams,
  AdminUser,
  AdminUserDetail,
  AdminUsersParams,
  BlockUserBody,
  MailSuspendBody,
  OauthClientItem,
  OauthClientVerifyBody,
  PlatformSettings,
  PlatformSettingsBody,
  ResetPasswordResponse,
  SetPasswordBody,
  TeacherCreateBody,
  TeacherCreated,
  TeacherPatchBody,
  UserPatchBody,
  UserRolesBody,
} from "../types/id-admin"

/** GET /v1/admin/users?query&role&status&cursor — admin. */
export function getAdminUsers(params?: AdminUsersParams, opts?: RequestOptions): Promise<Page<AdminUser>> {
  return api.get<Page<AdminUser>>("/v1/admin/users", { ...opts, query: params })
}
export const getAdminUsersQuery = (params?: AdminUsersParams) =>
  queryOptions({
    queryKey: keys.admin.users.list(params),
    queryFn: ({ signal }) => getAdminUsers(params, { signal }),
  })

/** GET /v1/admin/users/{id} — admin. */
export function getAdminUser(id: string, opts?: RequestOptions): Promise<AdminUserDetail> {
  return api.get<AdminUserDetail>(`/v1/admin/users/${seg(id)}`, opts)
}
export const getAdminUserQuery = (id: string) =>
  queryOptions({ queryKey: keys.admin.users.detail(id), queryFn: ({ signal }) => getAdminUser(id, { signal }) })

/** PATCH /v1/admin/users/{id} — admin; display name and email of any user (409 when the email is taken). */
export function patchAdminUser(id: string, body: UserPatchBody, opts?: RequestOptions): Promise<AdminUser> {
  return api.patch<AdminUser>(`/v1/admin/users/${seg(id)}`, body, opts)
}

/** POST /v1/admin/users/{id}/set-password — admin; `204`. Sets the (initial) password and ends the sessions. */
export function postAdminUserSetPassword(id: string, body: SetPasswordBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/admin/users/${seg(id)}/set-password`, body, opts)
}

/** POST /v1/admin/users/{id}/block — admin. */
export function postAdminUserBlock(id: string, body: BlockUserBody, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/users/${seg(id)}/block`, body, opts)
}

/** POST /v1/admin/users/{id}/unblock — admin. */
export function postAdminUserUnblock(id: string, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/users/${seg(id)}/unblock`, undefined, opts)
}

/** POST /v1/admin/users/{id}/roles — admin. */
export function postAdminUserRoles(id: string, body: UserRolesBody, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/users/${seg(id)}/roles`, body, opts)
}

/** POST /v1/admin/users/{id}/sessions/revoke — admin; `204`. */
export function postAdminUserSessionsRevoke(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/admin/users/${seg(id)}/sessions/revoke`, undefined, opts)
}

/** POST /v1/admin/users/{id}/reset-password — admin; returns the activation link to hand over. */
export function postAdminUserResetPassword(id: string, opts?: RequestOptions): Promise<ResetPasswordResponse> {
  return api.post<ResetPasswordResponse>(`/v1/admin/users/${seg(id)}/reset-password`, undefined, opts)
}

/** POST /v1/admin/users/{id}/reset-otp — admin; `204`. */
export function postAdminUserResetOtp(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/admin/users/${seg(id)}/reset-otp`, undefined, opts)
}

/** POST /v1/admin/users/{id}/mail/suspend — admin (MAIL-8). */
export function postAdminUserMailSuspend(id: string, body: MailSuspendBody, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/users/${seg(id)}/mail/suspend`, body, opts)
}

/** POST /v1/admin/users/{id}/mail/resume — admin. */
export function postAdminUserMailResume(id: string, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/users/${seg(id)}/mail/resume`, undefined, opts)
}

/** GET /v1/admin/teachers?query&status&cursor — admin. */
export function getAdminTeachers(params?: AdminTeachersParams, opts?: RequestOptions): Promise<Page<AdminUser>> {
  return api.get<Page<AdminUser>>("/v1/admin/teachers", { ...opts, query: params })
}
export const getAdminTeachersQuery = (params?: AdminTeachersParams) =>
  queryOptions({
    queryKey: keys.admin.teachers.list(params),
    queryFn: ({ signal }) => getAdminTeachers(params, { signal }),
  })

/** POST /v1/admin/teachers — admin; the activation URL is shown once. */
export function postAdminTeachers(body: TeacherCreateBody, opts?: RequestOptions): Promise<TeacherCreated> {
  return api.post<TeacherCreated>("/v1/admin/teachers", body, opts)
}

/** PATCH /v1/admin/teachers/{id} — admin. */
export function patchAdminTeacher(id: string, body: TeacherPatchBody, opts?: RequestOptions): Promise<AdminUser> {
  return api.patch<AdminUser>(`/v1/admin/teachers/${seg(id)}`, body, opts)
}

/** POST /v1/admin/teachers/{id}/deactivate — admin (kicks `academic.teacher_deactivated`). */
export function postAdminTeacherDeactivate(id: string, opts?: RequestOptions): Promise<AdminUser> {
  return api.post<AdminUser>(`/v1/admin/teachers/${seg(id)}/deactivate`, undefined, opts)
}

/** GET /v1/admin/audit?user_id&type&from&to&cursor — admin. */
export function getAdminAudit(params?: AdminAuditParams, opts?: RequestOptions): Promise<Page<AuditItem>> {
  return api.get<Page<AuditItem>>("/v1/admin/audit", { ...opts, query: params })
}
export const getAdminAuditQuery = (params?: AdminAuditParams) =>
  queryOptions({
    queryKey: keys.admin.audit(params),
    queryFn: ({ signal }) => getAdminAudit(params, { signal }),
  })

/** GET /v1/admin/oauth-clients — admin. */
export function getAdminOauthClients(opts?: RequestOptions): Promise<OauthClientItem[]> {
  return api.get<OauthClientItem[]>("/v1/admin/oauth-clients", opts)
}
export const getAdminOauthClientsQuery = () =>
  queryOptions({ queryKey: keys.admin.oauthClients(), queryFn: ({ signal }) => getAdminOauthClients({ signal }) })

/** POST /v1/admin/oauth-clients/{client_id}/verify — admin. */
export function postAdminOauthClientVerify(
  clientId: string,
  body: OauthClientVerifyBody,
  opts?: RequestOptions,
): Promise<OauthClientItem> {
  return api.post<OauthClientItem>(`/v1/admin/oauth-clients/${seg(clientId)}/verify`, body, opts)
}

// --- Names used by the app plans ---

export const listAdminUsers = getAdminUsers
export const listAudit = getAdminAudit

/** GET /v1/admin/settings — admin; the runtime platform settings and the feature flags. */
export function getAdminSettings(opts?: RequestOptions): Promise<PlatformSettings> {
  return api.get<PlatformSettings>("/v1/admin/settings", opts)
}
export const getAdminSettingsQuery = () =>
  queryOptions({ queryKey: keys.admin.settings(), queryFn: ({ signal }) => getAdminSettings({ signal }) })

/** PUT /v1/admin/settings — admin; saves every editable setting. */
export function putAdminSettings(body: PlatformSettingsBody, opts?: RequestOptions): Promise<PlatformSettings> {
  return api.put<PlatformSettings>("/v1/admin/settings", body, opts)
}
