import type {
  ConnectorCreateBody,
  ConsentBody,
  EmailChangeConfirmBody,
  LoginBody,
  LoginPasswordBody,
  LoginRestoreBody,
  LoginOtpBody,
  OtpEnableBody,
  TelegramLoginBody,
  TelegramPatchBody,
  TelegramStatusBody,
  UserPreferences,
  UserMe,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  activationInfo,
  adminMe,
  auditItems,
  connectorToken,
  connectors,
  consentInfo,
  loginInfo,
  loginResultRedirect,
  loginResultPasswordChange,
  loginResultRestore,
  loginResultSecondFactor,
  scopeCatalog,
  sessionItems,
  teacherMe,
  telegramAccounts,
  userMe,
  userPreferences,
} from "../fixtures/id"
import { accepted, apiUrl, nextId, noContent, notFound, paginate, param, problem, query, readJson } from "./utils"

/** The user a bearer token stands for: a token containing `teacher` or `admin` gives that role, anything else the student. */
export function userForRequest(request: Request): UserMe {
  const authorization = request.headers.get("Authorization") ?? ""
  if (authorization.includes("admin")) return adminMe
  if (authorization.includes("teacher")) return teacherMe
  return userMe
}

const HYDRA_REDIRECT = "http://localhost:4444/oauth2/auth?login_verifier=test"

/**
 * Magic values of the login endpoints (everything else succeeds):
 * login `second.factor` returns the second factor step, `locked.user` is `auth/locked`, `no.role` is `auth/role-missing`;
 * `pending.deletion` is scheduled for deletion (the restore step); password `wrong-password` is `auth/unauthorized`.
 */
function loginOutcome(login: string | undefined, password: string | undefined): Response {
  if (login === "locked.user") {
    return problem(423, "auth/locked", "Account is locked", { params: { retry_after: 300 } })
  }
  if (login === "no.role") return problem(403, "auth/role-missing", "The account has no role for this client")
  if (password === "wrong-password") {
    return problem(401, "auth/unauthorized", "Invalid login or password")
  }
  if (login === "second.factor") return HttpResponse.json(loginResultSecondFactor)
  if (login === "must.change") return HttpResponse.json(loginResultPasswordChange)
  if (login === "pending.deletion") return HttpResponse.json(loginResultRestore)
  return HttpResponse.json(loginResultRedirect)
}

export const idHandlers = [
  // --- Login app ---
  http.get(apiUrl("/v1/id/login"), ({ request }) => {
    const challenge = query(request).get("login_challenge")
    if (!challenge) return problem(422, "common/request-validation", "login_challenge is required")
    if (challenge === "skip") return HttpResponse.json({ ...loginInfo, skip: true, redirect_to: HYDRA_REDIRECT })
    if (challenge === "second-factor") return HttpResponse.json({ ...loginInfo, requires_second_factor: true })
    return HttpResponse.json(loginInfo)
  }),
  http.post(apiUrl("/v1/id/login"), async ({ request }) => {
    const body = await readJson<LoginBody>(request)
    return loginOutcome(body.login, body.password)
  }),
  http.post(apiUrl("/v1/id/login/password"), async ({ request }) => {
    const body = await readJson<LoginPasswordBody>(request)
    if (body.new_password === "Same-Password-1") {
      return problem(422, "id/password-policy", "The new password must differ", {
        params: { errors: ["id-password-unchanged"] },
      })
    }
    return HttpResponse.json(loginResultRedirect)
  }),
  // TODO(contract): the restore step of an account scheduled for deletion; ticket `stale` is `auth/unauthorized`.
  http.post(apiUrl("/v1/id/login/restore"), async ({ request }) => {
    const body = await readJson<LoginRestoreBody>(request)
    if (body.ticket === "stale") return problem(401, "auth/unauthorized", "Invalid login or password")
    return HttpResponse.json(loginResultRedirect)
  }),
  http.post(apiUrl("/v1/id/login/restore/decline"), () =>
    HttpResponse.json({ redirect_to: "http://localhost:4444/oauth2/auth?error=access_denied" }),
  ),
  http.post(apiUrl("/v1/id/login/ticket"), () =>
    HttpResponse.json({ redirect_to: "http://localhost:4444/oauth2/auth?login_verifier=ticket" }),
  ),
  http.post(apiUrl("/v1/id/login/otp/request"), () => HttpResponse.json({ sent: true }, { status: 202 })),
  http.post(apiUrl("/v1/id/login/otp"), async ({ request }) => {
    const body = await readJson<LoginOtpBody>(request)
    if (body.code === "000000") return problem(401, "auth/unauthorized", "Invalid code")
    return HttpResponse.json(loginResultRedirect)
  }),
  http.get(apiUrl("/v1/id/consent"), ({ request }) => {
    if (!query(request).get("consent_challenge")) {
      return problem(422, "common/request-validation", "consent_challenge is required")
    }
    return HttpResponse.json(consentInfo)
  }),
  http.post(apiUrl("/v1/id/consent"), async ({ request }) => {
    const body = await readJson<ConsentBody>(request)
    const redirect = body.accept === false ? "http://localhost:4444/oauth2/auth?error=access_denied" : HYDRA_REDIRECT
    return HttpResponse.json({ redirect_to: redirect })
  }),
  http.post(apiUrl("/v1/id/consent/otp"), () => accepted()),
  http.get(apiUrl("/v1/id/logout"), () => HttpResponse.json({ redirect_to: "http://localhost:3001/" })),

  // --- Login app: Telegram mini app. `init_data: "linked"` is an already linked account. ---
  http.post(apiUrl("/v1/id/telegram/status"), async ({ request }) => {
    const body = await readJson<TelegramStatusBody>(request)
    return HttpResponse.json(
      body.init_data === "linked" ? { linked: true, login: "brastilov.aleksey" } : { linked: false, login: null },
    )
  }),
  http.post(apiUrl("/v1/id/telegram/otp/request"), () => HttpResponse.json({ sent: true }, { status: 202 })),
  http.post(apiUrl("/v1/id/telegram/login"), async ({ request }) => {
    const body = await readJson<TelegramLoginBody>(request)
    if (body.login === "second.factor" && !body.otp_code) return HttpResponse.json(loginResultSecondFactor)
    const outcome = loginOutcome(body.login, body.password)
    if (!outcome.ok) return outcome
    return HttpResponse.json({ linked: true, login: body.login ?? "brastilov.aleksey" })
  }),

  // --- Login app: recovery ---
  http.post(apiUrl("/v1/id/recovery/password/request"), () => accepted()),
  http.post(apiUrl("/v1/id/recovery/password/confirm"), () => HttpResponse.json({ login_ticket: "reset-ticket" })),
  http.post(apiUrl("/v1/id/recovery/otp/request"), () => accepted()),
  http.post(apiUrl("/v1/id/recovery/otp/confirm"), () => HttpResponse.json({ effective_at: "2026-10-08T05:12:00Z" })),
  http.post(apiUrl("/v1/id/recovery/otp/cancel"), () => noContent()),
  http.post(apiUrl("/v1/id/recovery/login"), () => accepted()),

  // --- Login app: staff activation. The token `expired` is `404`. ---
  http.get(apiUrl("/v1/id/activation/:token"), ({ params }) => {
    if (param(params, "token") === "expired") return notFound("Activation link")
    return HttpResponse.json(activationInfo)
  }),
  http.post(apiUrl("/v1/id/activation/:token/email"), () => accepted()),
  http.post(apiUrl("/v1/id/activation/:token"), () =>
    HttpResponse.json({ redirect_to: "http://localhost:3001/security/otp/" }),
  ),
  http.get(apiUrl("/v1/id/mcp-scopes"), () => HttpResponse.json(scopeCatalog)),

  // --- Account ---
  http.get(apiUrl("/v1/id/me"), ({ request }) => HttpResponse.json(userForRequest(request))),
  http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
    const patch = await readJson<UserPreferences>(request)
    return HttpResponse.json({ ...userPreferences, ...patch })
  }),
  http.post(apiUrl("/v1/id/me/password"), () => noContent()),
  http.get(apiUrl("/v1/id/me/sessions"), () => HttpResponse.json(sessionItems)),
  // `revoke-others` is a POST, so it cannot be confused with the DELETE below.
  http.delete(apiUrl("/v1/id/me/sessions/:id"), () => noContent()),
  http.post(apiUrl("/v1/id/me/sessions/revoke-others"), () => noContent()),
  http.get(apiUrl("/v1/id/me/telegram"), () => HttpResponse.json(telegramAccounts)),
  http.patch(apiUrl("/v1/id/me/telegram/:telegramUserId"), async ({ params, request }) => {
    const body = await readJson<TelegramPatchBody>(request)
    const account = telegramAccounts.find((item) => String(item.telegram_user_id) === param(params, "telegramUserId"))
    if (!account) return notFound("Telegram account")
    return HttpResponse.json({ ...account, otp_delivery: body.otp_delivery ?? account.otp_delivery })
  }),
  http.delete(apiUrl("/v1/id/me/telegram/:telegramUserId"), () => noContent()),
  http.post(apiUrl("/v1/id/me/otp/enable"), async ({ request }) => {
    await readJson<OtpEnableBody>(request)
    return accepted()
  }),
  http.post(apiUrl("/v1/id/me/otp/enable/confirm"), ({ request }) =>
    HttpResponse.json({ ...userForRequest(request), otp_enabled: true }),
  ),
  http.post(apiUrl("/v1/id/me/otp/disable"), ({ request }) =>
    HttpResponse.json({ ...userForRequest(request), otp_enabled: false }),
  ),
  http.post(apiUrl("/v1/id/me/email/change"), () => accepted()),
  http.post(apiUrl("/v1/id/me/email/change/confirm"), async ({ request }) => {
    await readJson<EmailChangeConfirmBody>(request)
    return HttpResponse.json({ ...userForRequest(request), recovery_email: "new-address@example.org" })
  }),
  http.get(apiUrl("/v1/id/me/activity"), ({ request }) => HttpResponse.json(paginate(auditItems, request))),
  http.get(apiUrl("/v1/id/me/connectors"), () => HttpResponse.json(connectors)),
  http.post(apiUrl("/v1/id/me/connectors"), async ({ request }) => {
    const body = await readJson<ConnectorCreateBody>(request)
    const days = body.expires_in_days ?? 30
    return HttpResponse.json({
      connector: {
        id: nextId(11),
        name: body.name ?? "Connector",
        server: body.server ?? "student",
        scopes: body.scopes ?? [],
        course_ids: body.course_ids ?? null,
        kind: "token",
        token_prefix: connectorToken.slice(0, 9),
        created_at: "2026-10-07T05:12:00Z",
        last_used_at: null,
        expires_at: new Date(Date.UTC(2026, 9, 7 + days, 5, 12)).toISOString().replace(".000Z", "Z"),
        revoked_at: null,
      },
      token: connectorToken,
    })
  }),
  http.delete(apiUrl("/v1/id/me/connectors/:id"), () => noContent()),
  http.post(apiUrl("/v1/id/me/emis-password"), () => HttpResponse.json({ emis_status: "active" })),
  http.delete(apiUrl("/v1/id/me"), () => HttpResponse.json({ closes_on: "2026-11-06" }, { status: 202 })),
  http.post(apiUrl("/v1/id/me/step-up"), () => accepted()),
]
