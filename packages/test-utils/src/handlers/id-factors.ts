// TODO(contract): hand-written handlers of the authenticator app (TOTP) and passkey endpoints.
import type {
  LoginPasskeyBody,
  LoginTotpBody,
  Passkey,
  PasskeyRegisterBody,
  PasskeyRenameBody,
  SecurityFactors,
  TotpCodeBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { loginResultRedirect } from "../fixtures/id"
import { apiUrl, noContent, param, problem, readJson } from "./utils"

/** Base32 secret of the setup step; the otpauth URI encodes it with issuer IHT ID. */
export const TOTP_TEST_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"
/** Recovery codes returned by `/totp/confirm`. */
export const TOTP_TEST_RECOVERY_CODES = ["k7mqa-2xpab", "h3n9c-rtw4d", "p2zx8-bq6ve"]

const firstPasskey: Passkey = {
  id: "passkey-1",
  name: "MacBook",
  transports: ["internal", "hybrid"],
  backed_up: true,
  created_at: "2026-09-01T08:00:00Z",
  last_used_at: "2026-10-10T08:00:00Z",
}

let state: SecurityFactors = initialState()
let counter = 1

function initialState(): SecurityFactors {
  return { totp_enabled: false, recovery_codes_left: 0, password_login_enabled: true, passkeys: [firstPasskey] }
}

/** Put the factors back after each test. */
export function resetFactorsState(): void {
  state = initialState()
  counter = 1
}

/** Replace part of the factors (e.g. no passkeys, TOTP on). */
export function setFactorsState(patch: Partial<SecurityFactors>): void {
  state = { ...state, ...patch }
}

/** The current factors (for assertions). */
export function currentFactors(): SecurityFactors {
  return state
}

const invalidCode = () => problem(401, "auth/otp-invalid", "The code is wrong", { params: { attempts_left: 4 } })

const webAuthnOptions = (kind: "create" | "get") =>
  HttpResponse.json({
    options:
      kind === "create"
        ? {
            challenge: "Y2hhbGxlbmdl",
            rp: { id: "localhost", name: "IHT ID" },
            user: { id: "dXNlcg", name: "brastilov.aleksey", displayName: "Brastilov Aleksey" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            excludeCredentials: [],
            authenticatorSelection: { residentKey: "required", userVerification: "required" },
          }
        : { challenge: "Y2hhbGxlbmdl", rpId: "localhost", allowCredentials: [], userVerification: "required" },
  })

/** Magic values: code `000000` is wrong; a credential with `id: "unknown"` is `auth/passkey-invalid`. */
export const idFactorsHandlers = [
  http.get(apiUrl("/v1/id/me/security"), () => HttpResponse.json(state)),
  http.post(apiUrl("/v1/id/me/totp/setup"), () =>
    HttpResponse.json({
      secret: TOTP_TEST_SECRET,
      otpauth_uri: `otpauth://totp/IHT%20ID:brastilov.aleksey?secret=${TOTP_TEST_SECRET}&issuer=IHT%20ID`,
    }),
  ),
  http.post(apiUrl("/v1/id/me/totp/confirm"), async ({ request }) => {
    const body = await readJson<TotpCodeBody>(request)
    if (body.code === "000000") return invalidCode()
    state = { ...state, totp_enabled: true, recovery_codes_left: TOTP_TEST_RECOVERY_CODES.length }
    return HttpResponse.json({ recovery_codes: TOTP_TEST_RECOVERY_CODES })
  }),
  http.post(apiUrl("/v1/id/me/totp/disable"), async ({ request }) => {
    const body = await readJson<TotpCodeBody>(request)
    if (body.code === "000000") return invalidCode()
    state = { ...state, totp_enabled: false, recovery_codes_left: 0 }
    return HttpResponse.json(state)
  }),
  http.post(apiUrl("/v1/id/me/passkeys/options"), () => webAuthnOptions("create")),
  http.post(apiUrl("/v1/id/me/passkeys"), async ({ request }) => {
    const body = await readJson<PasskeyRegisterBody>(request)
    counter += 1
    const passkey: Passkey = {
      id: `passkey-${counter}`,
      name: body.name || "Passkey",
      transports: ["internal"],
      backed_up: false,
      created_at: "2026-10-17T08:00:00Z",
      last_used_at: null,
    }
    state = { ...state, passkeys: [...state.passkeys, passkey] }
    return HttpResponse.json(passkey)
  }),
  http.patch(apiUrl("/v1/id/me/passkeys/:id"), async ({ request, params }) => {
    const body = await readJson<PasskeyRenameBody>(request)
    const id = param(params, "id")
    const found = state.passkeys.find((p) => p.id === id)
    if (!found) return problem(404, "id/passkey-not-found", "No such passkey")
    const renamed = { ...found, name: body.name ?? found.name }
    state = { ...state, passkeys: state.passkeys.map((p) => (p.id === id ? renamed : p)) }
    return HttpResponse.json(renamed)
  }),
  http.delete(apiUrl("/v1/id/me/passkeys/:id"), ({ params }) => {
    const id = param(params, "id")
    if (!state.password_login_enabled && state.passkeys.length <= 1) {
      return problem(409, "id/last-passkey", "The last passkey stays while password sign-in is off")
    }
    state = { ...state, passkeys: state.passkeys.filter((p) => p.id !== id) }
    return noContent()
  }),
  http.post(apiUrl("/v1/id/me/password-login/disable"), () => {
    if (state.passkeys.length === 0) return problem(409, "id/passkey-required", "Add a passkey first")
    state = { ...state, password_login_enabled: false }
    return HttpResponse.json(state)
  }),
  http.post(apiUrl("/v1/id/login/totp"), async ({ request }) => {
    const body = await readJson<LoginTotpBody>(request)
    if (body.code === "000000") return invalidCode()
    return HttpResponse.json(loginResultRedirect)
  }),
  http.post(apiUrl("/v1/id/login/passkey/options"), () => webAuthnOptions("get")),
  http.post(apiUrl("/v1/id/login/passkey"), async ({ request }) => {
    const body = await readJson<LoginPasskeyBody>(request)
    if (body.credential?.id === "unknown") return problem(401, "auth/passkey-invalid", "Unknown passkey")
    return HttpResponse.json(loginResultRedirect)
  }),
]
