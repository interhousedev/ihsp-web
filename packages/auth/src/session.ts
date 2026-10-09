import {
  createApiClient,
  getMe,
  isApiError,
  isNetworkError,
  postOauthLogout,
  postOauthRefresh,
  postOauthTelegram,
  postOauthToken,
  setApiClient,
  type TokenResponse,
} from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { getInitDataRaw, isMiniApp } from "@ihsp/telegram"
import { broadcastLogout } from "./channel"
import { holdLogin, loginHeld, releaseLoginHold } from "./login-hold"
import { AuthError } from "./errors"
import { navigation } from "./navigation"
import { codeChallengeS256, generateCodeVerifier, randomString } from "./pkce"
import { getSession, resetAuthStore, useAuthStore } from "./store"

/** A token is refreshed when fewer than this many milliseconds are left. */
export const REFRESH_MARGIN_MS = 60_000

/** How long the login stays blocked after a logout started; the browser leaves the page well before. */
const LOGOUT_HOLD_MS = 30_000
const PENDING_KEY = "ihsp.oauth.pending"
const ATTEMPTS_KEY = "ihsp.oauth.attempts"
const RETRY_KEY = "ihsp.oauth.retry"
const CALLBACK_PATH = "/auth/callback/"

/** More automatic logins than this within `LOOP_WINDOW_MS` mean the login "succeeds" but the app is still unauthorised. */
const LOOP_LIMIT = 4
const LOOP_WINDOW_MS = 60_000
/**
 * Hydra errors that only mean "another login of this app started in this browser meanwhile" (two tabs share one CSRF
 * cookie per client). The callback starts one fresh login for them; after the first tab finished, single sign-on
 * completes it without a form. A callback without matching PKCE data (the page was reloaded after the code was
 * exchanged, a duplicated tab, an old link) is restarted the same way; it also ignores a foreign code.
 */
const RESTARTABLE_ERRORS = new Set(["request_forbidden"])
/** A restart is allowed once per this time, so a login that keeps failing ends with a message and not a loop. */
const RESTART_WINDOW_MS = 120_000

type Pending = { state: string; nonce: string; verifier: string; returnTo: string }

// - - - Module state (one tab) - - -

let loginInflight: Promise<void> | null = null
let callbackInflight: Promise<string> | null = null
let refreshInflight: Promise<boolean> | null = null
let bootstrapInflight: Promise<void> | null = null

/** Clears module state and the store; for tests. */
export function resetAuthState(): void {
  loginInflight = null
  callbackInflight = null
  refreshInflight = null
  bootstrapInflight = null
  releaseLoginHold()
  resetAuthStore()
}

// - - - Helpers - - -

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`
}

/** Only same-origin paths are followed after login (no open redirect), and never the callback page itself. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith(CALLBACK_PATH)) return "/"
  return value
}

function readPending(): Pending | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as Pending) : null
  } catch {
    return null
  }
}

function readAttempts(now: number): number[] {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(ATTEMPTS_KEY) ?? "[]") as unknown
    return Array.isArray(raw)
      ? raw.filter((at): at is number => typeof at === "number" && now - at < LOOP_WINDOW_MS)
      : []
  } catch {
    return []
  }
}

function writeAttempts(attempts: number[]): void {
  try {
    if (attempts.length > 0) window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
    else window.sessionStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    // Without sessionStorage there is no loop guard, and also no PKCE state: the login fails at the callback instead.
  }
}

/** Remembers that the callback restarted the login; `false` when it did so recently or cannot remember (no restart). */
function markRestarted(): boolean {
  try {
    const now = Date.now()
    const last = Number(window.sessionStorage.getItem(RETRY_KEY))
    if (last && now - last < RESTART_WINDOW_MS) return false
    window.sessionStorage.setItem(RETRY_KEY, String(now))
    return window.sessionStorage.getItem(RETRY_KEY) === String(now)
  } catch {
    return false
  }
}

/** The callback starts the login again (silently) when `markRestarted` allows it; the page waits for the browser. */
async function restartLogin(returnTo: string | undefined): Promise<Promise<string> | null> {
  if (!markRestarted()) return null
  await login(returnTo ?? "/")
  return new Promise<string>(() => undefined)
}

function clearLoginBookkeeping(): void {
  try {
    window.sessionStorage.removeItem(ATTEMPTS_KEY)
    window.sessionStorage.removeItem(RETRY_KEY)
  } catch {
    // nothing to clear
  }
}

function writePending(pending: Pending | null): void {
  try {
    if (pending) window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    else window.sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // sessionStorage can be blocked; the login then fails at the callback with a state error.
  }
}

/** Runs `task` while holding the Web Lock `name`, so only one tab at a time uses the refresh cookie. */
async function withLock<T>(name: string, task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks
  return locks ? locks.request(name, task) : task()
}

function applyToken(response: TokenResponse): void {
  useAuthStore.getState().setToken({
    access_token: response.access_token,
    expires_at: Date.now() + response.expires_in * 1000,
  })
}

/** Stores the token, loads the user (`GET /v1/id/me`) and marks the session as authenticated. */
async function establishSession(response: TokenResponse): Promise<void> {
  const store = useAuthStore.getState()
  applyToken(response)
  try {
    store.setUser(await getMe())
  } catch (cause) {
    store.clear()
    if (isApiError(cause)) throw cause
    throw new AuthError("no-session", cause instanceof Error ? cause.message : null)
  }
  store.setAuthenticated()
}

// - - - Login (authorization code + PKCE) - - -

export type LoginOptions = {
  /** A click of the user ("Log in again"): not limited by the loop guard, and it resets the guard. */
  manual?: boolean
}

/**
 * Starts the login: PKCE verifier, `state` and `nonce` go to sessionStorage and the browser is sent to Hydra.
 * The current page is replaced in the history (`location.replace`), so Back never lands on a page that would start
 * the login again. Calling it twice at once (React strict mode, two guards) starts one login. An automatic login that
 * keeps coming back unauthorised (4 times in a minute) is refused with `AuthError("login-loop")`.
 */
export function login(returnTo?: string, options: LoginOptions = {}): Promise<void> {
  // A logout is leaving the page: a login now would replace its navigation and keep the Hydra session alive.
  if (loginHeld()) return new Promise<void>(() => undefined)
  loginInflight ??= startLogin(returnTo ?? currentPath(), options).finally(() => {
    loginInflight = null
  })
  return loginInflight
}

async function startLogin(returnTo: string, options: LoginOptions): Promise<void> {
  const now = Date.now()
  const attempts = options.manual ? [] : readAttempts(now)
  if (attempts.length >= LOOP_LIMIT) throw new AuthError("login-loop")
  writeAttempts([...attempts, now])

  const config = getConfig()
  const verifier = generateCodeVerifier()
  const state = randomString(32)
  const nonce = randomString(32)
  writePending({ state, nonce, verifier, returnTo: safeReturnTo(returnTo) })

  const url = new URL("/oauth2/auth", config.HYDRA_URL)
  url.search = new URLSearchParams({
    client_id: config.OAUTH_CLIENT_ID,
    response_type: "code",
    scope: "openid offline_access",
    audience: "ihsp-api",
    redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
    state,
    nonce,
    code_challenge: await codeChallengeS256(verifier),
    code_challenge_method: "S256",
  }).toString()
  navigation.replace(url.toString())
}

/**
 * `/auth/callback/`: checks `state`, exchanges the code at `POST /v1/oauth/token`, loads the user and returns the path
 * to continue with. Calling it again (React strict mode) returns the same result, so the code is exchanged once.
 * A Hydra CSRF error (another login of this app was started in a second tab) or a callback without matching PKCE data
 * (the page was reloaded after the exchange) restarts the login once instead of failing; the returned promise then
 * never settles, because the browser is already leaving the page.
 */
export function handleCallback(): Promise<string> {
  callbackInflight ??= runCallback()
  return callbackInflight
}

async function runCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search)
  const pending = readPending()
  const failure = params.get("error")
  if (failure) {
    writePending(null)
    if (RESTARTABLE_ERRORS.has(failure)) {
      const restarted = await restartLogin(pending?.returnTo)
      if (restarted) return restarted
    }
    throw new AuthError("oauth-error", params.get("error_description") ?? failure)
  }

  const code = params.get("code")
  const state = params.get("state")
  if (!pending || !code || !state || pending.state !== state) {
    writePending(null)
    const restarted = await restartLogin(pending?.returnTo)
    if (restarted) return restarted
    throw new AuthError("state-mismatch")
  }
  writePending(null)

  const config = getConfig()
  const response = await postOauthToken({
    client_id: config.OAUTH_CLIENT_ID,
    code,
    code_verifier: pending.verifier,
    redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
  })
  await establishSession(response)
  clearLoginBookkeeping()
  return safeReturnTo(pending.returnTo)
}

// - - - Refresh and token access - - -

/** Mini apps log in with `initData` again instead of using the cookie (cookies are unreliable in Telegram). */
async function exchangeTelegram(): Promise<boolean> {
  const initData = getInitDataRaw()
  const client = getConfig().OAUTH_CLIENT_ID
  if (!initData || (client !== "sp" && client !== "staff")) return false
  try {
    await establishSession(await postOauthTelegram({ client_id: client, init_data: initData }))
    return true
  } catch (error) {
    return failRefresh(error)
  }
}

async function exchangeCookie(): Promise<boolean> {
  const before = useAuthStore.getState().token
  try {
    const response = await postOauthRefresh({ client_id: getConfig().OAUTH_CLIENT_ID })
    const hadUser = useAuthStore.getState().user !== null
    if (hadUser) {
      applyToken(response)
      useAuthStore.getState().setAuthenticated()
    } else {
      await establishSession(response)
    }
    return true
  } catch (error) {
    // The login callback may have signed the user in while this request was in flight: its token wins.
    if (useAuthStore.getState().token !== before) return false
    return failRefresh(error)
  }
}

/** A rejected refresh ends the session; a network failure keeps whatever we have and reports `false`. */
function failRefresh(error: unknown): false {
  const store = useAuthStore.getState()
  if (isNetworkError(error)) {
    if (store.status === "loading") store.setNetworkError(true)
  } else {
    store.clear()
  }
  return false
}

/**
 * Gets a new access token. One refresh runs at a time in this tab (shared promise) and across tabs
 * (`navigator.locks`, name `rt_<client>`); the cookie request uses `credentials: "include"` and `X-IHSP-Client`.
 */
export function refresh(): Promise<boolean> {
  refreshInflight ??= withLock(`rt_${getConfig().OAUTH_CLIENT_ID}`, () =>
    isMiniApp() ? exchangeTelegram() : exchangeCookie(),
  ).finally(() => {
    refreshInflight = null
  })
  return refreshInflight
}

/** The current access token, refreshed first when fewer than 60 seconds are left; `null` when logged out. */
export async function getAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().token
  if (token && token.expires_at - Date.now() > REFRESH_MARGIN_MS) return token.access_token
  const refreshed = await refresh()
  const next = useAuthStore.getState().token
  if (refreshed && next) return next.access_token
  // A failed refresh (offline) still leaves a token that may be valid for a few more seconds.
  return next && next.expires_at > Date.now() ? next.access_token : null
}

/**
 * Restores the session (cookie refresh, or `initData` in a mini app). Runs once per page, and only when something on
 * the page needs the session (`useSession`, `RequireAuth`): the login, consent and registration pages do not.
 */
export function bootstrapSession(): Promise<void> {
  // Only a page that has not decided yet restores a session; a logged-in or logged-out store is left alone.
  if (useAuthStore.getState().status !== "loading") return Promise.resolve()
  // The callback page owns the session: it signs in with the code. A refresh next to it would race with the exchange.
  if (window.location.pathname.startsWith(CALLBACK_PATH)) return Promise.resolve()
  bootstrapInflight ??= (async () => {
    const ok = await refresh()
    const store = useAuthStore.getState()
    if (!ok && !store.networkError && store.status === "loading") store.setAnonymous()
  })()
  return bootstrapInflight
}

/** After a network failure at start: try again. */
export function retryBootstrap(): Promise<void> {
  bootstrapInflight = null
  useAuthStore.getState().setNetworkError(false)
  return bootstrapSession()
}

// - - - Logout - - -

/** `POST /v1/oauth/logout`, drops the tokens (here and in other tabs) and goes to the `logout_url` from Hydra. */
export async function logout(): Promise<void> {
  const { logout_url } = await postOauthLogout({ client_id: getConfig().OAUTH_CLIENT_ID })
  holdLogin(LOGOUT_HOLD_MS)
  useAuthStore.getState().clear()
  broadcastLogout()
  navigation.assign(logout_url)
}

// - - - API client wiring - - -

/** A 401 that survived a refresh: the session is over. `RequireAuth` then starts the login. */
function handleUnauthorized(): void {
  useAuthStore.getState().clear()
}

/** Installs the API client that sends our token, refreshes once on 401 and drops the session if that fails. */
export function configureApiClient(): void {
  setApiClient(
    createApiClient({
      getToken: getAccessToken,
      onRefresh: refresh,
      onUnauthorized: handleUnauthorized,
    }),
  )
}

export { getSession }
