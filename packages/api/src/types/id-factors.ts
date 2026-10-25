// Identity — authenticator app (TOTP) and passkeys (WebAuthn) of the signed-in user, and the second login steps.
// TODO(contract): hand-written until the OpenAPI is regenerated.

/** One passkey (no key material). */
export type Passkey = {
  id: string
  name: string
  transports: string[]
  backed_up: boolean
  created_at: string
  last_used_at: string | null
}

/** GET /v1/id/me/security. */
export type SecurityFactors = {
  totp_enabled: boolean
  recovery_codes_left: number
  password_login_enabled: boolean
  passkeys: Passkey[]
}

/** POST /v1/id/me/totp/setup: `otpauth_uri` is shown as a QR code, `secret` for manual entry. */
export type TotpSetup = { secret: string; otpauth_uri: string }

export type TotpCodeBody = { code: string }

export type RecoveryCodes = { recovery_codes: string[] }

/** WebAuthn options as JSON (base64url fields), for navigator.credentials.create/get. */
export type WebAuthnOptions = { options: Record<string, unknown> }

export type PasskeyRegisterBody = { credential: Record<string, unknown>; name: string }

export type PasskeyRenameBody = { name: string }

export type LoginTotpBody = { login_challenge: string; ticket: string; code: string }

export type LoginPasskeyOptionsBody = { login_challenge: string }

export type LoginPasskeyBody = { login_challenge: string; credential: Record<string, unknown>; remember: boolean }
