/**
 * Identity audit event codes (backend `identity/domain/audit_event.py` and the literal types it writes) and the
 * message key of each one in the `account` namespace (`auditEvents.<key>`). A code not listed here is shown as is.
 */
const AUDIT_EVENT_KEYS = {
  "login.success": "loginSuccess",
  "login.failed": "loginFailed",
  logout: "logout",
  "password.changed": "passwordChanged",
  "password.reset": "passwordReset",
  "password.reset_by_admin": "passwordResetByAdmin",
  "otp.enabled": "otpEnabled",
  "otp.disabled": "otpDisabled",
  "otp.reset_requested": "otpResetRequested",
  "otp.reset_cancelled": "otpResetCancelled",
  "otp.reset_applied": "otpResetApplied",
  "otp.reset_by_admin": "otpResetByAdmin",
  "email.changed": "emailChanged",
  "telegram.linked": "telegramLinked",
  "telegram.unlinked": "telegramUnlinked",
  "session.revoked": "sessionRevoked",
  "sessions.revoked": "sessionsRevoked",
  "connector.created": "connectorCreated",
  "connector.revoked": "connectorRevoked",
  "role.granted": "roleGranted",
  "role.revoked": "roleRevoked",
  "user.created": "userCreated",
  "user.registered": "userRegistered",
  "user.updated": "userUpdated",
  "user.blocked": "userBlocked",
  "user.unblocked": "userUnblocked",
  "user.activated": "userActivated",
  "user.deactivated": "userDeactivated",
  "user.deleted": "userDeleted",
  "user.purged": "userPurged",
  "account.deleted": "accountDeleted",
  "account.reclaimed": "accountReclaimed",
  "student.viewed": "studentViewed",
  "mail.suspended": "mailSuspended",
  "mail.resumed": "mailResumed",
  "oauth_client.verified": "oauthClientVerified",
  "emis.password_updated": "emisPasswordUpdated",
} as const

export type AuditEventKey = (typeof AUDIT_EVENT_KEYS)[keyof typeof AUDIT_EVENT_KEYS]

/** The message key of an audit event code, or null for a code this app has no text for. */
export function auditEventKey(code: string): AuditEventKey | null {
  return Object.hasOwn(AUDIT_EVENT_KEYS, code) ? AUDIT_EVENT_KEYS[code as keyof typeof AUDIT_EVENT_KEYS] : null
}
