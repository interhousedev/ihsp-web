// Identity — administration (backend § API contract → "Identity — administration (B1)").

import type { PageParams, Role } from "./common"
import type { AuditItem, SessionItem, TelegramAccount } from "./id"

export const ACCOUNT_KINDS = ["school", "alumni", "external", "staff"] as const
export type AccountKind = (typeof ACCOUNT_KINDS)[number]

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
  /** Link to the profile photo, valid for an hour; null when there is none. */
  photo_url: string | null
  created_at: string | null
  last_login_at: string | null
  phone?: string | null
  account_kind?: AccountKind
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

export type AdminUsersParams = PageParams & {
  query?: string
  role?: Role
  status?: UserStatus
  account_kind?: AccountKind
}
export type AdminTeachersParams = PageParams & { query?: string; status?: UserStatus }

/** `POST /v1/admin/users`: a staff-like account without EMIS (no student or teacher role). */
export type UserCreateBody = {
  last_name: string
  first_name: string
  middle_name?: string | null
  phone?: string | null
  email?: string | null
  account_kind: AccountKind
  roles: Role[]
}
/** The created account and its one-time Telegram invitation (`https://t.me/<bot>?start=inv_<code>`). */
export type InvitedUser = { user: AdminUser; invite_url: string }

export type BlockUserBody = { reason: string }
export type UserRolesBody = { grant: Role[]; revoke: Role[] }
export type ResetPasswordResponse = { activation_url: string }
/** `PATCH /v1/admin/users/{id}`: omitted keeps; a blank middle name clears it. TODO(contract): `login` is hand-written until openapi is regenerated. */
export type UserPatchBody = {
  last_name?: string
  first_name?: string
  middle_name?: string
  login?: string
  email?: string
}
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

/** A honours rule without a parameter. */
export type HonoursFlagRule = { enabled: boolean }
/** A honours rule limiting the semester marks of 4 (`max` 0..20). */
export type HonoursMaxFoursRule = { enabled: boolean; max: number }
/** The school certificate serials that count as a medal certificate. */
export type HonoursSerialsRule = { enabled: boolean; serials: string[] }
/** Which rules count for the red diploma and the gold and silver medals. */
export type AdminHonoursRules = {
  red_diploma_max_fours: HonoursMaxFoursRule
  medal_certificate: HonoursSerialsRule
  gold_controls_all_five: HonoursFlagRule
  gold_semester_all_five: HonoursFlagRule
  silver_controls_all_five: HonoursFlagRule
  silver_semester_max_fours: HonoursMaxFoursRule
}

/** `PUT /v1/admin/settings` body: every editable setting; `honours` holds all six rules, `null` keeps them unchanged. */
export type PlatformSettingsBody = {
  school_name: string
  support_contact: string
  change_password_on_login: boolean
  default_language: PlatformLocale
  honours: AdminHonoursRules | null
}

/** `GET /v1/admin/settings`: the editable settings and the read-only feature flags. */
export type PlatformSettings = PlatformSettingsBody & {
  features: Record<string, boolean>
  /** API-relative link of the uploaded lyceum logo (`/v1/public/lyceum-logo?v=…`); `null` when none. */
  lyceum_logo_url?: string | null
}
