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
import { AuthError } from "./errors"
import { navigation } from "./navigation"
import { codeChallengeS256, generateCodeVerifier, randomString } from "./pkce"
import { getSession, resetAuthStore, useAuthStore } from "./store"

/** A token is refreshed when fewer than this many milliseconds are left. */
export const REFRESH_MARGIN_MS = 60_000

const PENDING_KEY = "ihsp.oauth.pending"
const CALLBACK_PATH = "/auth/callback/"

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

/**
 * Starts the login: PKCE verifier, `state` and `nonce` go to sessionStorage and the browser is sent to Hydra.
 * Calling it twice (React strict mode, two guards) starts one login.
 */
export function login(returnTo?: string): Promise<void> {
  loginInflight ??= startLogin(returnTo ?? currentPath()).catch((error: unknown) => {
    loginInflight = null
    throw error
  })
  return loginInflight
}

async function startLogin(returnTo: string): Promise<void> {
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
  navigation.assign(url.toString())
}

/**
 * `/auth/callback/`: checks `state`, exchanges the code at `POST /v1/oauth/token`, loads the user and returns the
 * path to continue with. Calling it again (React strict mode) returns the same result.
 */
export function handleCallback(): Promise<string> {
  callbackInflight ??= runCallback()
  return callbackInflight
}

async function runCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search)
  const failure = params.get("error")
  if (failure) {
    writePending(null)
    throw new AuthError("oauth-error", params.get("error_description") ?? failure)
  }

  const pending = readPending()
  const code = params.get("code")
  const state = params.get("state")
  if (!pending || !code || !state || pending.state !== state) {
    writePending(null)
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

/** Restores the session on page load (cookie refresh, or `initData` in a mini app). Runs once per page. */
export function bootstrapSession(): Promise<void> {
  // Only a page that has not decided yet restores a session; a logged-in or logged-out store is left alone.
  if (useAuthStore.getState().status !== "loading") return Promise.resolve()
  bootstrapInflight ??= (async () => {
    const ok = await refresh()
    const store = useAuthStore.getState()
    if (!ok && !store.networkError) store.setAnonymous()
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
