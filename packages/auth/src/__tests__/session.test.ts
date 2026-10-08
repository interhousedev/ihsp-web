import { beforeEach, describe, expect, it, spyOn } from "bun:test"
import { refreshedTokenResponse, logoutResponse, server, setTestRoute, tokenResponse, userMe } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
import { codeChallengeS256 } from "../pkce"
import { navigation } from "../navigation"
import {
  configureApiClient,
  getAccessToken,
  handleCallback,
  login,
  logout,
  refresh,
  resetAuthState,
  safeReturnTo,
} from "../session"
import { getSession, setSession, useAuthStore } from "../store"

const API = "http://localhost:8000"
const PENDING_KEY = "ihsp.oauth.pending"

function readPending(): { state: string; verifier: string; nonce: string; returnTo: string } {
  return JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "null")
}

function lastRedirect(assign: ReturnType<typeof spyOn<typeof navigation, "assign">>): URL {
  return new URL(String(assign.mock.calls.at(-1)?.[0]))
}

beforeEach(() => {
  resetAuthState()
  configureApiClient()
})

describe("login", () => {
  it("redirects to Hydra with a PKCE S256 challenge, state and the callback URL", async () => {
    const assign = spyOn(navigation, "assign").mockImplementation(() => undefined)

    await login("/grades/")

    const url = lastRedirect(assign)
    const pending = readPending()
    expect(url.origin + url.pathname).toBe("http://localhost:4444/oauth2/auth")
    expect(url.searchParams.get("client_id")).toBe("sp")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("scope")).toBe("openid offline_access")
    expect(url.searchParams.get("audience")).toBe("ihsp-api")
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/auth/callback/")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("state")).toBe(pending.state)
    expect(url.searchParams.get("state")).toHaveLength(32)
    expect(url.searchParams.get("nonce")).toHaveLength(32)
    expect(url.searchParams.get("code_challenge")).toBe(await codeChallengeS256(pending.verifier))
    expect(pending.returnTo).toBe("/grades/")
  })

  it("two calls at once start one login (strict mode runs effects twice)", async () => {
    const assign = spyOn(navigation, "assign").mockImplementation(() => undefined)

    await Promise.all([login("/"), login("/")])

    expect(assign).toHaveBeenCalledTimes(1)
  })
})

describe("handleCallback", () => {
  async function startLogin(returnTo = "/homework/"): Promise<{ state: string; verifier: string }> {
    spyOn(navigation, "assign").mockImplementation(() => undefined)
    await login(returnTo)
    return readPending()
  }

  it("rejects a wrong state and exchanges nothing", async () => {
    await startLogin()
    setTestRoute("/auth/callback/?code=abc&state=not-the-state")
    let exchanged = false
    server.use(
      http.post(`${API}/v1/oauth/token`, () => {
        exchanged = true
        return HttpResponse.json(tokenResponse)
      }),
    )

    await expect(handleCallback()).rejects.toMatchObject({ code: "state-mismatch" })

    expect(exchanged).toBe(false)
    expect(getSession()).toBeNull()
  })

  it("rejects a callback when no login was started in this tab", async () => {
    setTestRoute("/auth/callback/?code=abc&state=anything")

    await expect(handleCallback()).rejects.toMatchObject({ code: "state-mismatch" })
  })

  it("exchanges the code with the verifier, loads the user and returns the page to continue on", async () => {
    const { state, verifier } = await startLogin("/homework/?tab=later")
    setTestRoute(`/auth/callback/?code=the-code&state=${state}`)
    let body: Record<string, string> = {}
    let clientHeader: string | null = null
    server.use(
      http.post(`${API}/v1/oauth/token`, async ({ request }) => {
        body = (await request.json()) as Record<string, string>
        clientHeader = request.headers.get("X-IHSP-Client")
        return HttpResponse.json(tokenResponse)
      }),
    )

    const returnTo = await handleCallback()

    expect(returnTo).toBe("/homework/?tab=later")
    expect(body).toEqual({
      client_id: "sp",
      code: "the-code",
      code_verifier: verifier,
      redirect_uri: "http://localhost:3000/auth/callback/",
    })
    expect(clientHeader as string | null).toBe("sp")
    expect(useAuthStore.getState().status).toBe("authenticated")
    expect(getSession()?.access_token).toBe(tokenResponse.access_token)
    expect(getSession()?.user.id).toBe(userMe.id)
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it("reports an error returned by Hydra", async () => {
    setTestRoute("/auth/callback/?error=access_denied&error_description=No")

    await expect(handleCallback()).rejects.toMatchObject({ code: "oauth-error" })
  })
})

describe("safeReturnTo", () => {
  it("allows same-origin paths only and never the callback page", () => {
    expect(safeReturnTo("/grades/?tab=day")).toBe("/grades/?tab=day")
    expect(safeReturnTo("https://evil.example/")).toBe("/")
    expect(safeReturnTo("//evil.example/")).toBe("/")
    expect(safeReturnTo("/auth/callback/?code=1")).toBe("/")
    expect(safeReturnTo(null)).toBe("/")
  })
})

describe("refresh and getAccessToken", () => {
  it("concurrent getAccessToken calls trigger one refresh and share the token", async () => {
    let refreshes = 0
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () => {
        refreshes += 1
        return HttpResponse.json(refreshedTokenResponse)
      }),
    )

    const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()])

    expect(refreshes).toBe(1)
    const expected = refreshedTokenResponse.access_token
    expect(tokens).toEqual([expected, expected, expected])
  })

  it("keeps a token that is valid for more than 60 seconds without refreshing", async () => {
    setSession({ access_token: "still-good", expires_at: Date.now() + 5 * 60_000, user: userMe })
    let refreshes = 0
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () => {
        refreshes += 1
        return HttpResponse.json(refreshedTokenResponse)
      }),
    )

    expect(await getAccessToken()).toBe("still-good")
    expect(refreshes).toBe(0)
  })

  it("refreshes a token that has less than 60 seconds left", async () => {
    setSession({ access_token: "expiring", expires_at: Date.now() + 30_000, user: userMe })

    expect(await getAccessToken()).toBe(refreshedTokenResponse.access_token)
  })

  it("refresh sends the cookie (credentials: include) and the X-IHSP-Client header", async () => {
    const fetchSpy = spyOn(globalThis, "fetch")

    await refresh()

    const call = fetchSpy.mock.calls.find(([input]) => String(input).endsWith("/v1/oauth/refresh"))
    expect(call).toBeDefined()
    const init = call?.[1] as RequestInit
    expect(init.credentials).toBe("include")
    expect(new Headers(init.headers).get("X-IHSP-Client")).toBe("sp")
    expect(new Headers(init.headers).get("Authorization")).toBeNull()
  })

  it("a rejected refresh ends the session and reports false", async () => {
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () =>
        HttpResponse.json(
          { type: "auth/unauthorized", title: "No session", status: 401 },
          { status: 401, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )

    expect(await refresh()).toBe(false)
    expect(useAuthStore.getState().status).toBe("anonymous")
  })
})

describe("logout", () => {
  it("clears the token store and navigates to the logout_url from the server", async () => {
    setSession({ access_token: "token", expires_at: Date.now() + 5 * 60_000, user: userMe })
    const assign = spyOn(navigation, "assign").mockImplementation(() => undefined)

    await logout()

    expect(getSession()).toBeNull()
    expect(useAuthStore.getState().status).toBe("anonymous")
    expect(assign).toHaveBeenCalledWith(logoutResponse.logout_url)
  })

  it("does not clear the session when the server call fails", async () => {
    setSession({ access_token: "token", expires_at: Date.now() + 5 * 60_000, user: userMe })
    const assign = spyOn(navigation, "assign").mockImplementation(() => undefined)
    server.use(http.post(`${API}/v1/oauth/logout`, () => HttpResponse.error()))

    await expect(logout()).rejects.toBeDefined()

    expect(getSession()).not.toBeNull()
    expect(assign).not.toHaveBeenCalled()
  })
})
