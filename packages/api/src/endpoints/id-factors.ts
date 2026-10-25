// Identity — authenticator app (TOTP), passkeys and the password sign-in switch. TODO(contract).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent } from "../types/common"
import type { LoginResult } from "../types/id"
import type {
  LoginPasskeyBody,
  LoginPasskeyOptionsBody,
  LoginTotpBody,
  Passkey,
  PasskeyRegisterBody,
  PasskeyRenameBody,
  RecoveryCodes,
  SecurityFactors,
  TotpCodeBody,
  TotpSetup,
  WebAuthnOptions,
} from "../types/id-factors"

/** GET /v1/id/me/security — bearer. */
export function getIdMeSecurity(opts?: RequestOptions): Promise<SecurityFactors> {
  return api.get<SecurityFactors>("/v1/id/me/security", opts)
}
export const getIdMeSecurityQuery = () =>
  queryOptions({ queryKey: keys.id.security(), queryFn: ({ signal }) => getIdMeSecurity({ signal }) })

/** POST /v1/id/me/totp/setup — bearer; a new secret valid for 10 minutes. */
export function postIdMeTotpSetup(opts?: RequestOptions): Promise<TotpSetup> {
  return api.post<TotpSetup>("/v1/id/me/totp/setup", undefined, opts)
}

/** POST /v1/id/me/totp/confirm — bearer; the recovery codes are returned once. */
export function postIdMeTotpConfirm(body: TotpCodeBody, opts?: RequestOptions): Promise<RecoveryCodes> {
  return api.post<RecoveryCodes>("/v1/id/me/totp/confirm", body, opts)
}

/** POST /v1/id/me/totp/disable — bearer; a fresh code or a recovery code. */
export function postIdMeTotpDisable(body: TotpCodeBody, opts?: RequestOptions): Promise<SecurityFactors> {
  return api.post<SecurityFactors>("/v1/id/me/totp/disable", body, opts)
}

/** POST /v1/id/me/passkeys/options — bearer. */
export function postIdMePasskeyOptions(opts?: RequestOptions): Promise<WebAuthnOptions> {
  return api.post<WebAuthnOptions>("/v1/id/me/passkeys/options", undefined, opts)
}

/** POST /v1/id/me/passkeys — bearer. */
export function postIdMePasskey(body: PasskeyRegisterBody, opts?: RequestOptions): Promise<Passkey> {
  return api.post<Passkey>("/v1/id/me/passkeys", body, opts)
}

/** PATCH /v1/id/me/passkeys/{id} — bearer. */
export function patchIdMePasskey(id: string, body: PasskeyRenameBody, opts?: RequestOptions): Promise<Passkey> {
  return api.patch<Passkey>(`/v1/id/me/passkeys/${seg(id)}`, body, opts)
}

/** DELETE /v1/id/me/passkeys/{id} — bearer; `id/last-passkey` while password sign-in is off. */
export function deleteIdMePasskey(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/id/me/passkeys/${seg(id)}`, opts)
}

/** POST /v1/id/me/password-login/disable — bearer; needs a passkey (`id/passkey-required`). */
export function postIdMePasswordLoginDisable(opts?: RequestOptions): Promise<SecurityFactors> {
  return api.post<SecurityFactors>("/v1/id/me/password-login/disable", undefined, opts)
}

/** POST /v1/id/login/totp — none; the authenticator code (or a recovery code) after the password. */
export function postIdLoginTotp(body: LoginTotpBody, opts?: RequestOptions): Promise<LoginResult> {
  return api.post<LoginResult>("/v1/id/login/totp", body, { ...opts, auth: "none" })
}

/** POST /v1/id/login/passkey/options — none. */
export function postIdLoginPasskeyOptions(
  body: LoginPasskeyOptionsBody,
  opts?: RequestOptions,
): Promise<WebAuthnOptions> {
  return api.post<WebAuthnOptions>("/v1/id/login/passkey/options", body, { ...opts, auth: "none" })
}

/** POST /v1/id/login/passkey — none. */
export function postIdLoginPasskey(body: LoginPasskeyBody, opts?: RequestOptions): Promise<LoginResult> {
  return api.post<LoginResult>("/v1/id/login/passkey", body, { ...opts, auth: "none" })
}
