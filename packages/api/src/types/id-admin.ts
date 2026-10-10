// Identity — administration (backend § API contract → "Identity — administration (B1)").

import type { PageParams, Role } from "./common"
import type { AuditItem, SessionItem, TelegramAccount } from "./id"

export type AdminUser = {
  id: string
  login: string | null
  first_name: string
  last_name: string
  middle_name: string | null
  roles: Role[]
  status: string
  emis_status: string | null
  recovery_email: string | null
  mail_suspended: boolean
  password_change_required?: boolean
  created_at: string | null
  last_login_at: string | null
}

export type AdminUserDetail = AdminUser & {
  /** The full student address (`login@<mail domain>`); null for non-students. */
  mailbox?: string | null
  telegram: TelegramAccount[]
  sessions: SessionItem[]
  recent_audit: AuditItem[]
}

/** Account states of the identity module. */
export type UserStatus = "active" | "blocked" | "deactivated" | "deleted" | "pending_activation" | "unregistered"

export type AdminUsersParams = PageParams & { query?: string; role?: Role; status?: UserStatus }
export type AdminTeachersParams = PageParams & { query?: string; status?: UserStatus }

export type BlockUserBody = { reason: string }
export type UserRolesBody = { grant: Role[]; revoke: Role[] }
export type ResetPasswordResponse = { activation_url: string }
/** `PATCH /v1/admin/users/{id}`: omitted keeps; a blank middle name clears it. */
export type UserPatchBody = { last_name?: string; first_name?: string; middle_name?: string; email?: string }
/** `POST /v1/admin/users/{id}/set-password`. */
export type SetPasswordBody = { password: string; require_change?: boolean }
export type MailSuspendBody = { reason: string }

export type TeacherCreateBody = {
  last_name: string
  first_name: string
  middle_name?: string
  email: string
}
/** `activation_url` is shown once so the admin can copy it. */
export type TeacherCreated = { user: AdminUser; activation_url: string }
export type TeacherPatchBody = Partial<TeacherCreateBody>

export type AdminAuditParams = PageParams & {
  user_id?: string
  type?: string
  from?: string
  to?: string
}

export type OauthClientItem = {
  client_id: string
  name: string
  verified: boolean
  dynamic: boolean
  last_used_at: string | null
}
export type OauthClientVerifyBody = { verified: boolean }

export type PlatformLocale = "uz" | "ru" | "en"

/** `PUT /v1/admin/settings` body: every editable setting. */
export type PlatformSettingsBody = {
  school_name: string
  support_contact: string
  change_password_on_login: boolean
  default_language: PlatformLocale
}

/** `GET /v1/admin/settings`: the editable settings and the read-only feature flags. */
export type PlatformSettings = PlatformSettingsBody & { features: Record<string, boolean> }
