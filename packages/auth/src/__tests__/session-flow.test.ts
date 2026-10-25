import { beforeEach, describe, expect, it, spyOn } from "bun:test"
import { refreshedTokenResponse, server, setTestRoute, tokenResponse, userMe } from "@ihsp/test-utils"
import { HttpResponse, delay, http } from "msw"
import { navigation } from "../navigation"
import { clearSessionHint, setSessionHint } from "../session-hint"
import {
  bootstrapSession,
  configureApiClient,
  handleCallback,
  login,
  refresh,
  resetAuthState,
  silentSignInPending,
  trySilentSignIn,
} from "../session"
import { setSession, useAuthStore } from "../store"

const API = "http://localhost:8000"
const PENDING_KEY = "ihsp.oauth.pending"

function readPending(): { state: string; verifier: string; returnTo: string } {
  return JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "null")
}

function quiet() {
  return { replace: spyOn(navigation, "replace").mockImplementation(() => undefined) }
}

function unauthorized() {
  return HttpResponse.json(
    { type: "auth/unauthorized", title: "No session", status: 401 },
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  )
}

beforeEach(() => {
  setSessionHint()
  resetAuthState()
  configureApiClient()
})

async function startPending(returnTo: string) {
  quiet()
  await login(returnTo)
  return readPending()
}

describe("login redirect", () => {
  it("replaces the current history entry, so Back never returns to a page that logs in again", async () => {
    const { replace } = quiet()
    const assign = spyOn(navigation, "assign").mockImplementation(() => undefined)

    await login("/grades/")

    expect(replace).toHaveBeenCalledTimes(1)
    expect(assign).not.toHaveBeenCalled()
  })

  it("stops an automatic login loop after four attempts in a minute (a 401 that a new login cannot fix)", async () => {
    quiet()
    for (let attempt = 0; attempt < 4; attempt += 1) await login("/")

    await expect(login("/")).rejects.toMatchObject({ code: "login-loop" })
  })

  it("lets the user try again by hand after the loop guard stopped the automatic login", async () => {
    const { replace } = quiet()
    for (let attempt = 0; attempt < 4; attempt += 1) await login("/")
    await expect(login("/")).rejects.toMatchObject({ code: "login-loop" })

    await login("/", { manual: true })

    expect(replace).toHaveBeenCalledTimes(5)
    await expect(login("/")).resolves.toBeUndefined()
  })

  it("a finished login clears the attempts", async () => {
    quiet()
    for (let attempt = 0; attempt < 3; attempt += 1) await login("/")
    setTestRoute(`/auth/callback/?code=c&state=${readPending().state}`)
    await handleCallback()
    resetAuthState()
    configureApiClient()

    for (let attempt = 0; attempt < 4; attempt += 1) await login("/")
  })
})

describe("callback restarts a login that lost the Hydra CSRF cookie (two tabs of one app)", () => {
  it("starts one new login, silently, and keeps the page to return to", async () => {
    await startPending("/homework/")
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)
    replace.mockClear()
    setTestRoute("/auth/callback/?error=request_forbidden&error_description=The+CSRF+value+does+not+match")

    const outcome = await Promise.race([
      handleCallback().then(() => "settled"),
      new Promise((resolve) => setTimeout(() => resolve("pending"), 150)),
    ])

    expect(outcome).toBe("pending") // the page keeps its spinner while the browser leaves
    expect(replace).toHaveBeenCalledTimes(1)
    expect(String(replace.mock.calls[0]?.[0])).toContain("/oauth2/auth")
    expect(readPending().returnTo).toBe("/homework/")
  })

  it("does not retry twice: the second error is shown", async () => {
    await startPending("/")
    quiet()
    setTestRoute("/auth/callback/?error=request_forbidden&error_description=csrf")
    void handleCallback()
    await new Promise((resolve) => setTimeout(resolve, 50))
    resetAuthState() // the browser navigated: a new page, the same sessionStorage
    configureApiClient()

    await expect(handleCallback()).rejects.toMatchObject({ code: "oauth-error" })
  })

  it("does not retry other errors (the user said no)", async () => {
    await startPending("/")
    setTestRoute("/auth/callback/?error=access_denied&error_description=No")

    await expect(handleCallback()).rejects.toMatchObject({ code: "oauth-error" })
  })

  it("a successful callback forgets that it retried", async () => {
    await startPending("/")
    setTestRoute("/auth/callback/?error=request_forbidden")
    void handleCallback()
    await new Promise((resolve) => setTimeout(resolve, 50))
    resetAuthState()
    configureApiClient()
    const second = await startPending("/")
    setTestRoute(`/auth/callback/?code=c&state=${second.state}`)

    await handleCallback()
    resetAuthState()
    configureApiClient()

    await startPending("/")
    setTestRoute("/auth/callback/?error=request_forbidden")
    const outcome = await Promise.race([
      handleCallback().then(() => "settled"),
      new Promise((resolve) => setTimeout(() => resolve("pending"), 100)),
    ])
    expect(outcome).toBe("pending")
  })
})

describe("restoring the session", () => {
  it("a late failed refresh does not wipe a session that the login callback established meanwhile", async () => {
    server.use(
      http.post(`${API}/v1/oauth/refresh`, async () => {
        await delay(60)
        return unauthorized()
      }),
    )

    const bootstrap = bootstrapSession()
    setSession({ access_token: "from-callback", expires_at: Date.now() + 10 * 60_000, user: userMe })
    await bootstrap

    expect(useAuthStore.getState().status).toBe("authenticated")
    expect(useAuthStore.getState().token?.access_token).toBe("from-callback")
  })

  it("a failed refresh without any session ends as anonymous", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => unauthorized()))

    await bootstrapSession()

    expect(useAuthStore.getState().status).toBe("anonymous")
  })

  it("sends no refresh request without a sign-in hint, and restores the session with one", async () => {
    let refreshes = 0
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () => {
        refreshes += 1
        return HttpResponse.json(refreshedTokenResponse)
      }),
    )
    clearSessionHint()
    await bootstrapSession()
    expect(refreshes).toBe(0)
    expect(useAuthStore.getState().status).toBe("anonymous")

    resetAuthState()
    setSessionHint()
    await bootstrapSession()
    expect(refreshes).toBe(1)
    expect(useAuthStore.getState().status).toBe("authenticated")
  })

  it("never restores a session on the callback page, which owns the session", async () => {
    setTestRoute("/auth/callback/?code=c&state=s")
    let refreshes = 0
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () => {
        refreshes += 1
        return HttpResponse.json(refreshedTokenResponse)
      }),
    )

    await bootstrapSession()

    expect(refreshes).toBe(0)
    expect(useAuthStore.getState().status).toBe("loading")
  })

  it("the callback exchanges the code once even when called twice (React strict mode)", async () => {
    quiet()
    await login("/")
    setTestRoute(`/auth/callback/?code=c&state=${readPending().state}`)
    let exchanges = 0
    server.use(
      http.post(`${API}/v1/oauth/token`, () => {
        exchanges += 1
        return HttpResponse.json(tokenResponse)
      }),
    )

    await Promise.all([handleCallback(), handleCallback()])

    expect(exchanges).toBe(1)
  })

  it("refresh keeps working when cookies are rotated by another request", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => HttpResponse.json(refreshedTokenResponse)))

    expect(await refresh()).toBe(true)
    expect(useAuthStore.getState().status).toBe("authenticated")
  })
})

describe("silent single sign-on (prompt=none)", () => {
  beforeEach(() => window.sessionStorage.removeItem("ihsp.oauth.silent"))

  it("asks Hydra with prompt=none once per browser session, even without the hint", async () => {
    clearSessionHint()
    const replace = quiet().replace

    await trySilentSignIn()
    await trySilentSignIn()

    expect(replace).toHaveBeenCalledTimes(1)
    expect(new URL(String(replace.mock.calls[0]?.[0])).searchParams.get("prompt")).toBe("none")
    expect(silentSignInPending()).toBe(false)
  })

  it("login_required leaves the visitor anonymous, with no error, on the page they came from", async () => {
    quiet()
    await login("/browse/", { silent: true })
    setTestRoute(`/auth/callback/?error=login_required&state=${readPending().state}`)

    await expect(handleCallback()).resolves.toBe("/browse/")
    expect(useAuthStore.getState().status).toBe("anonymous")
  })

  it("an error without the state of this login does not take the silent bypass", async () => {
    quiet()
    await login("/browse/", { silent: true })
    setTestRoute("/auth/callback/?error=login_required")

    await expect(handleCallback()).rejects.toThrow()
    expect(useAuthStore.getState().status).not.toBe("anonymous")
  })

  it("consent_required (signed in elsewhere, first visit here) continues with an ordinary login", async () => {
    const { replace } = quiet()
    await login("/browse/", { silent: true })
    setTestRoute(`/auth/callback/?error=consent_required&state=${readPending().state}`)

    void handleCallback()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(replace).toHaveBeenCalledTimes(2)
    const retry = new URL(String(replace.mock.calls[1]?.[0]))
    expect(retry.searchParams.has("prompt")).toBe(false)
    expect(readPending().returnTo).toBe("/browse/")
  })

  it("an ordinary login does not send prompt=none", async () => {
    const { replace } = quiet()

    await login("/")

    expect(new URL(String(replace.mock.calls[0]?.[0])).searchParams.has("prompt")).toBe(false)
  })
})
