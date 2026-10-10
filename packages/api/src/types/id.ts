// Identity — login app and account (backend § API contract → "Identity — OAuth token handler and login app",
// "Identity — account", Schemas, and the `POST /v1/id/me/step-up` addition).

import type { PageParams, PersonRef, Role } from "./common"

export type LoginInfo = {
  client_id: string
  client_name: string
  skip: boolean
  requires_second_factor: boolean
  redirect_to: string | null
}

export type LoginResult = {
  redirect_to: string | null
  second_factor: { method: "otp"; ticket: string; channels: ("telegram" | "email")[] } | null
}

export type ConsentInfo = {
  client_id: string
  client_name: string
  verified: boolean
  redirect_domain: string
  server: "student" | "lms" | "admin" | null
  requested_scopes: string[]
  requires_otp: boolean
  redirect_to: string | null
}

export type ScopeCatalog = {
  servers: {
    server: "student" | "lms" | "admin"
    roles: Role[]
    scopes: { scope: string; tools: string[] }[]
    presets: { key: string; scopes: string[] }[]
  }[]
}

export type TelegramAccount = {
  telegram_user_id: number
  username: string | null
  otp_delivery: boolean
  blocked: boolean
  linked_at: string
}

export type UserPreferences = {
  locale: "uz" | "ru" | "en"
  theme: "system" | "light" | "dark"
  marks_enabled: boolean
  marks_types: ("lesson" | "midterm" | "final")[]
  marks_values: number[]
  marks_subject_ids: string[] | null
  alerts_drops: boolean
  alerts_gpa_below: number | null
  alerts_semester_mark_below: number | null
  alerts_mark_below: number | null
  lessons_links_lead_min: number
  lessons_prompt_enabled: boolean
  mail_forward_to_telegram: boolean
  /** Web Push on the account's devices (each device is switched on in its own settings). */
  notify_push: boolean
  today_cards: string[]
  onboarding_dismissed: string[]
  /** The sp phone bottom bar: up to 4 destination ids, `null` until the user picks. */
  bottom_nav: string[] | null
  seen_marks_at: string | null
}

export type UserMe = {
  id: string
  login: string | null
  first_name: string
  last_name: string
  middle_name: string | null
  roles: Role[]
  status: string
  recovery_email: string | null
  otp_enabled: boolean
  otp_via_email: boolean
  emis_status: "active" | "needs_reauth" | null
  mailbox: string | null
  preferences: UserPreferences
  telegram: TelegramAccount[]
}

export type SessionItem = {
  id: string
  ip: string | null
  user_agent: string | null
  amr: string[]
  last_seen_at: string
  current: boolean
}

export type AuditItem = {
  id: string
  type: string
  ip: string | null
  user_agent: string | null
  actor: PersonRef | null
  created_at: string
  metadata: Record<string, unknown>
}

export type Connector = {
  id: string
  name: string
  server: "student" | "lms" | "admin"
  scopes: string[]
  course_ids: string[] | null
  kind: "token" | "oauth"
  token_prefix: string | null
  created_at: string | null
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

// --- Request bodies and small responses ---

export type LoginBody = {
  login_challenge: string
  login: string
  password: string
  remember: boolean
}

export type LoginOtpRequestBody = { login_challenge: string; login: string }
/** `202` of the OTP request endpoint (always, ID-13). */
export type LoginOtpRequestResponse = { sent: true }
export type LoginOtpBody = { login_challenge: string; login: string; code: string; ticket?: string }

export type ConsentBody = {
  consent_challenge: string
  accept: boolean
  grant_scopes: string[]
  otp_code?: string
}
/** `POST /v1/id/consent/otp` (backend addition): the challenge names the user, so no bearer token is needed. */
export type ConsentOtpBody = { consent_challenge: string }

export type TelegramStatusBody = { init_data: string }
export type TelegramStatus = { linked: boolean; login: string | null }

/** `POST /v1/id/telegram/otp/request` (backend addition): `init_data` proves the caller instead of a Hydra challenge. */
export type TelegramOtpRequestBody = { init_data: string; login: string }

export type TelegramLoginBody = {
  init_data: string
  login: string
  password?: string
  otp_code?: string
}
/** `{linked: true, login}` or a `LoginResult` carrying the second factor step. */
export type TelegramLoginResult = { linked: true; login: string } | LoginResult

export type RecoveryPasswordRequestBody = { login_or_email: string }
export type RecoveryPasswordConfirmBody = {
  login_or_email: string
  code: string
  new_password: string
}
export type RecoveryOtpRequestBody = { login: string }
export type RecoveryOtpConfirmBody = { login: string; code: string }
export type RecoveryOtpConfirmResponse = { effective_at: string }
export type RecoveryOtpCancelBody = { request_id: string }
export type RecoveryLoginBody = { email: string }

export type ActivationInfo = {
  first_name: string
  last_name: string
  /** Null until the account has a login. */
  login: string | null
  /** Administration accounts: OTP is switched on (by email) when the activation is completed. */
  requires_otp: boolean
}
export type ActivationEmailBody = { email: string }
export type ActivationBody = { password: string; email: string; email_code: string }

export type UserPreferencesPatch = Partial<UserPreferences>
export type PasswordChangeBody = { current_password: string; new_password: string }
export type TelegramPatchBody = { otp_delivery: boolean }
export type OtpEnableBody = { via_email: boolean }
export type OtpEnableConfirmBody = { code: string }
export type OtpDisableBody = { password: string }
export type EmailChangeBody = { password: string; new_email: string }
export type EmailChangeConfirmBody = { code: string }
export type ActivityParams = Pick<PageParams, "cursor" | "limit">

export type ConnectorCreateBody = {
  server: "student" | "lms" | "admin"
  name: string
  scopes: string[]
  course_ids?: string[]
  expires_in_days: number
  otp_code?: string
}
/** `token` is shown to the user once. */
export type ConnectorCreated = { connector: Connector; token: string }

export type EmisPasswordBody = { emis_password: string }
export type EmisPasswordResponse = { emis_status: "active" | "needs_reauth" }

export type DeleteAccountBody = { password: string; otp_code?: string }
export type DeleteAccountResponse = { closes_on: string }
