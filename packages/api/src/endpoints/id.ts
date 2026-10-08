// Identity — login app (Hydra challenges, recovery, activation) and the signed-in user's account.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page, RedirectResponse } from "../types/common"
import type {
  ActivationBody,
  ActivationEmailBody,
  ActivationInfo,
  ActivityParams,
  AuditItem,
  ConsentBody,
  ConsentInfo,
  ConsentOtpBody,
  Connector,
  ConnectorCreateBody,
  ConnectorCreated,
  DeleteAccountBody,
  DeleteAccountResponse,
  EmailChangeBody,
  EmailChangeConfirmBody,
  EmisPasswordBody,
  EmisPasswordResponse,
  LoginBody,
  LoginInfo,
  LoginOtpBody,
  LoginOtpRequestBody,
  LoginOtpRequestResponse,
  LoginResult,
  OtpDisableBody,
  OtpEnableBody,
  OtpEnableConfirmBody,
  PasswordChangeBody,
  RecoveryLoginBody,
  RecoveryOtpCancelBody,
  RecoveryOtpConfirmBody,
  RecoveryOtpConfirmResponse,
  RecoveryOtpRequestBody,
  RecoveryPasswordConfirmBody,
  RecoveryPasswordRequestBody,
  ScopeCatalog,
  SessionItem,
  TelegramAccount,
  TelegramLoginBody,
  TelegramLoginResult,
  TelegramOtpRequestBody,
  TelegramPatchBody,
  TelegramStatus,
  TelegramStatusBody,
  UserMe,
  UserPreferences,
  UserPreferencesPatch,
} from "../types/id"

// --- Login app: Hydra login, consent, logout ---

/** GET /v1/id/login?login_challenge= — none. */
export function getIdLogin(loginChallenge: string, opts?: RequestOptions): Promise<LoginInfo> {
  return api.get<LoginInfo>("/v1/id/login", {
    ...opts,
    auth: "none",
    query: { login_challenge: loginChallenge },
  })
}
export const getIdLoginQuery = (loginChallenge: string) =>
  queryOptions({
    queryKey: keys.id.login(loginChallenge),
    queryFn: ({ signal }) => getIdLogin(loginChallenge, { signal }),
  })

/** POST /v1/id/login — none. */
export function postIdLogin(body: LoginBody, opts?: RequestOptions): Promise<LoginResult> {
  return api.post<LoginResult>("/v1/id/login", body, { ...opts, auth: "none" })
}

/** POST /v1/id/login/otp/request — none; `202 {sent: true}` always (ID-13). */
export function postIdLoginOtpRequest(
  body: LoginOtpRequestBody,
  opts?: RequestOptions,
): Promise<LoginOtpRequestResponse> {
  return api.post<LoginOtpRequestResponse>("/v1/id/login/otp/request", body, { ...opts, auth: "none" })
}

/** POST /v1/id/login/otp — none. */
export function postIdLoginOtp(body: LoginOtpBody, opts?: RequestOptions): Promise<LoginResult> {
  return api.post<LoginResult>("/v1/id/login/otp", body, { ...opts, auth: "none" })
}

/** GET /v1/id/consent?consent_challenge= — none. */
export function getIdConsent(consentChallenge: string, opts?: RequestOptions): Promise<ConsentInfo> {
  return api.get<ConsentInfo>("/v1/id/consent", {
    ...opts,
    auth: "none",
    query: { consent_challenge: consentChallenge },
  })
}
export const getIdConsentQuery = (consentChallenge: string) =>
  queryOptions({
    queryKey: keys.id.consent(consentChallenge),
    queryFn: ({ signal }) => getIdConsent(consentChallenge, { signal }),
  })

/** POST /v1/id/consent — none. */
export function postIdConsent(body: ConsentBody, opts?: RequestOptions): Promise<RedirectResponse> {
  return api.post<RedirectResponse>("/v1/id/consent", body, { ...opts, auth: "none" })
}

/** POST /v1/id/consent/otp — none; `202`. Sends the step-up code of an Administration consent (the challenge names the user). */
export function postIdConsentOtp(body: ConsentOtpBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/consent/otp", body, { ...opts, auth: "none" })
}

/** GET /v1/id/logout?logout_challenge= — none. */
export function getIdLogout(logoutChallenge: string, opts?: RequestOptions): Promise<RedirectResponse> {
  return api.get<RedirectResponse>("/v1/id/logout", {
    ...opts,
    auth: "none",
    query: { logout_challenge: logoutChallenge },
  })
}

// --- Login app: Telegram mini app ---

/** POST /v1/id/telegram/status — none. */
export function postIdTelegramStatus(body: TelegramStatusBody, opts?: RequestOptions): Promise<TelegramStatus> {
  return api.post<TelegramStatus>("/v1/id/telegram/status", body, { ...opts, auth: "none" })
}

/** POST /v1/id/telegram/otp/request — none; `202 {sent: true}` always (ID-13). The mini app has no Hydra challenge. */
export function postIdTelegramOtpRequest(
  body: TelegramOtpRequestBody,
  opts?: RequestOptions,
): Promise<LoginOtpRequestResponse> {
  return api.post<LoginOtpRequestResponse>("/v1/id/telegram/otp/request", body, { ...opts, auth: "none" })
}

/** POST /v1/id/telegram/login — none; `{linked: true, login}` or a `LoginResult` with the second factor. */
export function postIdTelegramLogin(body: TelegramLoginBody, opts?: RequestOptions): Promise<TelegramLoginResult> {
  return api.post<TelegramLoginResult>("/v1/id/telegram/login", body, { ...opts, auth: "none" })
}

// --- Login app: recovery ---

/** POST /v1/id/recovery/password/request — none; `202`. */
export function postIdRecoveryPasswordRequest(
  body: RecoveryPasswordRequestBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/recovery/password/request", body, { ...opts, auth: "none" })
}

/** POST /v1/id/recovery/password/confirm — none; `204`. */
export function postIdRecoveryPasswordConfirm(
  body: RecoveryPasswordConfirmBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/recovery/password/confirm", body, { ...opts, auth: "none" })
}

/** POST /v1/id/recovery/otp/request — none; `202`. */
export function postIdRecoveryOtpRequest(body: RecoveryOtpRequestBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/recovery/otp/request", body, { ...opts, auth: "none" })
}

/** POST /v1/id/recovery/otp/confirm — none; OTP is reset after `effective_at` (24 h). */
export function postIdRecoveryOtpConfirm(
  body: RecoveryOtpConfirmBody,
  opts?: RequestOptions,
): Promise<RecoveryOtpConfirmResponse> {
  return api.post<RecoveryOtpConfirmResponse>("/v1/id/recovery/otp/confirm", body, {
    ...opts,
    auth: "none",
  })
}

/** POST /v1/id/recovery/otp/cancel — none; `request_id` comes from the Telegram button; `204`. */
export function postIdRecoveryOtpCancel(body: RecoveryOtpCancelBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/recovery/otp/cancel", body, { ...opts, auth: "none" })
}

/** POST /v1/id/recovery/login — none; `202`. */
export function postIdRecoveryLogin(body: RecoveryLoginBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/recovery/login", body, { ...opts, auth: "none" })
}

// --- Login app: staff activation ---

/** GET /v1/id/activation/{token} — none. */
export function getIdActivation(token: string, opts?: RequestOptions): Promise<ActivationInfo> {
  return api.get<ActivationInfo>(`/v1/id/activation/${seg(token)}`, { ...opts, auth: "none" })
}
export const getIdActivationQuery = (token: string) =>
  queryOptions({
    queryKey: keys.id.activation(token),
    queryFn: ({ signal }) => getIdActivation(token, { signal }),
  })

/** POST /v1/id/activation/{token}/email — none; `202`. */
export function postIdActivationEmail(
  token: string,
  body: ActivationEmailBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.post<NoContent>(`/v1/id/activation/${seg(token)}/email`, body, { ...opts, auth: "none" })
}

/** POST /v1/id/activation/{token} — none. */
export function postIdActivation(
  token: string,
  body: ActivationBody,
  opts?: RequestOptions,
): Promise<RedirectResponse> {
  return api.post<RedirectResponse>(`/v1/id/activation/${seg(token)}`, body, { ...opts, auth: "none" })
}

/** GET /v1/id/mcp-scopes — none. */
export function getIdMcpScopes(opts?: RequestOptions): Promise<ScopeCatalog> {
  return api.get<ScopeCatalog>("/v1/id/mcp-scopes", { ...opts, auth: "none" })
}
export const getIdMcpScopesQuery = () =>
  queryOptions({ queryKey: keys.id.scopes(), queryFn: ({ signal }) => getIdMcpScopes({ signal }) })

// --- Account (bearer) ---

/** GET /v1/id/me — bearer. */
export function getIdMe(opts?: RequestOptions): Promise<UserMe> {
  return api.get<UserMe>("/v1/id/me", opts)
}
export const getIdMeQuery = () => queryOptions({ queryKey: keys.id.me(), queryFn: ({ signal }) => getIdMe({ signal }) })

/** PATCH /v1/id/me/preferences — bearer; partial `UserPreferences`. */
export function patchIdMePreferences(body: UserPreferencesPatch, opts?: RequestOptions): Promise<UserPreferences> {
  return api.patch<UserPreferences>("/v1/id/me/preferences", body, opts)
}

/** POST /v1/id/me/password — bearer; `204`. */
export function postIdMePassword(body: PasswordChangeBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/me/password", body, opts)
}

/** GET /v1/id/me/sessions — bearer. */
export function getIdMeSessions(opts?: RequestOptions): Promise<SessionItem[]> {
  return api.get<SessionItem[]>("/v1/id/me/sessions", opts)
}
export const getIdMeSessionsQuery = () =>
  queryOptions({ queryKey: keys.id.sessions(), queryFn: ({ signal }) => getIdMeSessions({ signal }) })

/** DELETE /v1/id/me/sessions/{id} — bearer; `204`. */
export function deleteIdMeSession(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/id/me/sessions/${seg(id)}`, opts)
}

/** POST /v1/id/me/sessions/revoke-others — bearer; `204`. */
export function postIdMeSessionsRevokeOthers(opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/me/sessions/revoke-others", undefined, opts)
}

/** GET /v1/id/me/telegram — bearer. */
export function getIdMeTelegram(opts?: RequestOptions): Promise<TelegramAccount[]> {
  return api.get<TelegramAccount[]>("/v1/id/me/telegram", opts)
}
export const getIdMeTelegramQuery = () =>
  queryOptions({ queryKey: keys.id.telegram(), queryFn: ({ signal }) => getIdMeTelegram({ signal }) })

/** PATCH /v1/id/me/telegram/{telegram_user_id} — bearer. */
export function patchIdMeTelegram(
  telegramUserId: number,
  body: TelegramPatchBody,
  opts?: RequestOptions,
): Promise<TelegramAccount> {
  return api.patch<TelegramAccount>(`/v1/id/me/telegram/${seg(telegramUserId)}`, body, opts)
}

/** DELETE /v1/id/me/telegram/{telegram_user_id} — bearer; `204`. */
export function deleteIdMeTelegram(telegramUserId: number, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/id/me/telegram/${seg(telegramUserId)}`, opts)
}

/** POST /v1/id/me/otp/enable — bearer; `202`. */
export function postIdMeOtpEnable(body: OtpEnableBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/me/otp/enable", body, opts)
}

/** POST /v1/id/me/otp/enable/confirm — bearer. */
export function postIdMeOtpEnableConfirm(body: OtpEnableConfirmBody, opts?: RequestOptions): Promise<UserMe> {
  return api.post<UserMe>("/v1/id/me/otp/enable/confirm", body, opts)
}

/** POST /v1/id/me/otp/disable — bearer. */
export function postIdMeOtpDisable(body: OtpDisableBody, opts?: RequestOptions): Promise<UserMe> {
  return api.post<UserMe>("/v1/id/me/otp/disable", body, opts)
}

/** POST /v1/id/me/email/change — bearer; `202`. */
export function postIdMeEmailChange(body: EmailChangeBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/me/email/change", body, opts)
}

/** POST /v1/id/me/email/change/confirm — bearer. */
export function postIdMeEmailChangeConfirm(body: EmailChangeConfirmBody, opts?: RequestOptions): Promise<UserMe> {
  return api.post<UserMe>("/v1/id/me/email/change/confirm", body, opts)
}

/** GET /v1/id/me/activity?cursor — bearer. */
export function getIdMeActivity(params?: ActivityParams, opts?: RequestOptions): Promise<Page<AuditItem>> {
  return api.get<Page<AuditItem>>("/v1/id/me/activity", { ...opts, query: params })
}
export const getIdMeActivityQuery = (params?: ActivityParams) =>
  queryOptions({
    queryKey: keys.id.activity(params),
    queryFn: ({ signal }) => getIdMeActivity(params, { signal }),
  })

/** GET /v1/id/me/connectors — bearer. */
export function getIdMeConnectors(opts?: RequestOptions): Promise<Connector[]> {
  return api.get<Connector[]>("/v1/id/me/connectors", opts)
}
export const getIdMeConnectorsQuery = () =>
  queryOptions({ queryKey: keys.id.connectors(), queryFn: ({ signal }) => getIdMeConnectors({ signal }) })

/** POST /v1/id/me/connectors — bearer; the token in the response is shown once. */
export function postIdMeConnectors(body: ConnectorCreateBody, opts?: RequestOptions): Promise<ConnectorCreated> {
  return api.post<ConnectorCreated>("/v1/id/me/connectors", body, opts)
}

/** DELETE /v1/id/me/connectors/{id} — bearer; `204`. */
export function deleteIdMeConnector(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/id/me/connectors/${seg(id)}`, opts)
}

/** POST /v1/id/me/emis-password — student (B2). */
export function postIdMeEmisPassword(body: EmisPasswordBody, opts?: RequestOptions): Promise<EmisPasswordResponse> {
  return api.post<EmisPasswordResponse>("/v1/id/me/emis-password", body, opts)
}

/** DELETE /v1/id/me — bearer (B2); `202 {closes_on}`. */
export function deleteIdMe(body: DeleteAccountBody, opts?: RequestOptions): Promise<DeleteAccountResponse> {
  return api.delete<DeleteAccountResponse>("/v1/id/me", { ...opts, body })
}

/** POST /v1/id/me/step-up — bearer (contract addition); `202`, sends an OTP before connectors and account deletion. */
export function postIdMeStepUp(opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/id/me/step-up", undefined, opts)
}

// --- Names used by the app plans (web/FINAL_PLAN.md § 3.2 and § 4 page tables) ---

export const getLoginInfo = getIdLogin
export const postLogin = postIdLogin
export const postLoginOtpRequest = postIdLoginOtpRequest
export const postLoginOtp = postIdLoginOtp
export const getConsentInfo = getIdConsent
export const postConsent = postIdConsent
export const postConsentOtp = postIdConsentOtp
export const getLogout = getIdLogout
export const postTelegramStatus = postIdTelegramStatus
export const postTelegramLogin = postIdTelegramLogin
export const postTelegramOtpRequest = postIdTelegramOtpRequest
export const getActivation = getIdActivation
export const postActivationEmail = postIdActivationEmail
export const postActivation = postIdActivation
export const getMcpScopes = getIdMcpScopes
export const getMe = getIdMe
export const patchPreferences = patchIdMePreferences
export const postPassword = postIdMePassword
export const listSessions = getIdMeSessions
export const deleteSession = deleteIdMeSession
export const revokeOtherSessions = postIdMeSessionsRevokeOthers
export const listTelegram = getIdMeTelegram
export const patchTelegram = patchIdMeTelegram
export const deleteTelegram = deleteIdMeTelegram
export const postOtpEnable = postIdMeOtpEnable
export const postOtpEnableConfirm = postIdMeOtpEnableConfirm
export const postOtpDisable = postIdMeOtpDisable
export const listActivity = getIdMeActivity
export const listConnectors = getIdMeConnectors
export const postConnector = postIdMeConnectors
export const deleteConnector = deleteIdMeConnector
export const postEmisPassword = postIdMeEmisPassword
export const deleteMe = deleteIdMe
export const postStepUp = postIdMeStepUp
