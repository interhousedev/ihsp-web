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
  created_at: string | null
  last_login_at: string | null
}

export type AdminUserDetail = AdminUser & {
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
