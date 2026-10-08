import { beforeEach, describe, expect, it, spyOn } from "bun:test"
import { I18nTestProvider } from "@ihsp/i18n"
import enMessages from "@ihsp/i18n/messages/en.json"
import { refreshedTokenResponse, server, setTestRoute, testRouter, tokenResponse } from "@ihsp/test-utils"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode, type ReactNode } from "react"
import { HttpResponse, http } from "msw"
import { AuthCallback } from "../auth-callback"
import { AuthProvider } from "../auth-provider"
import { navigation } from "../navigation"
import { RequireAuth } from "../require-auth"
import { configureApiClient, login, resetAuthState } from "../session"

const API = "http://localhost:8000"
const PENDING_KEY = "ihsp.oauth.pending"

function Providers({ children }: { children: ReactNode }) {
  return <I18nTestProvider messages={enMessages}>{children}</I18nTestProvider>
}

function unauthorized() {
  return HttpResponse.json(
    { type: "auth/unauthorized", title: "No session", status: 401 },
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  )
}

beforeEach(() => {
  resetAuthState()
  configureApiClient()
})

async function pending(): Promise<string> {
  spyOn(navigation, "replace").mockImplementation(() => undefined)
  await login("/homework/")
  const state = (JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "null") as { state: string }).state
  resetAuthState()
  configureApiClient()
  return state
}

describe("AuthProvider", () => {
  it("does not restore the session by itself: pages without a login send no refresh request", async () => {
    let refreshes = 0
    server.use(
      http.post(`${API}/v1/oauth/refresh`, () => {
        refreshes += 1
        return unauthorized()
      }),
    )

    render(
      <Providers>
        <AuthProvider>
          <p>login form</p>
        </AuthProvider>
      </Providers>,
    )
    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(screen.getByText("login form")).toBeInTheDocument()
    expect(refreshes).toBe(0)
  })
})

describe("RequireAuth", () => {
  it("tries the refresh cookie first, then redirects, and shows the same single spinner all along", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => unauthorized()))
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)

    render(
      <Providers>
        <AuthProvider>
          <RequireAuth>
            <p>secret</p>
          </RequireAuth>
        </AuthProvider>
      </Providers>,
    )

    const spinner = screen.getByRole("status")
    expect(spinner).toHaveTextContent("Signing you in…")
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1))
    expect(String(replace.mock.calls[0]?.[0])).toContain("/oauth2/auth")
    expect(screen.getByRole("status")).toHaveTextContent("Signing you in…")
    expect(screen.queryByText("secret")).not.toBeInTheDocument()
  })

  it("shows the page without any redirect when the refresh cookie is good", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => HttpResponse.json(refreshedTokenResponse)))
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)

    render(
      <Providers>
        <AuthProvider>
          <RequireAuth>
            <p>secret</p>
          </RequireAuth>
        </AuthProvider>
      </Providers>,
    )

    expect(await screen.findByText("secret")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("starts one login even in strict mode", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => unauthorized()))
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)

    render(
      <StrictMode>
        <Providers>
          <AuthProvider>
            <RequireAuth>
              <p>secret</p>
            </RequireAuth>
          </AuthProvider>
        </Providers>
      </StrictMode>,
    )

    await waitFor(() => expect(replace).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it("stops redirecting when logins keep coming back unauthorised and offers a manual retry", async () => {
    server.use(http.post(`${API}/v1/oauth/refresh`, () => unauthorized()))
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)
    for (let attempt = 0; attempt < 4; attempt += 1) await login("/")
    replace.mockClear()
    resetAuthState()
    configureApiClient()
    const user = userEvent.setup()

    render(
      <Providers>
        <AuthProvider>
          <RequireAuth>
            <p>secret</p>
          </RequireAuth>
        </AuthProvider>
      </Providers>,
    )

    expect(await screen.findByText("We could not complete the login.")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Log in again" }))

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1))
  })
})

describe("AuthCallback", () => {
  it("shows one spinner, exchanges the code once and replaces the history entry", async () => {
    const state = await pending()
    setTestRoute(`/auth/callback/?code=c&state=${state}`)
    let exchanges = 0
    server.use(
      http.post(`${API}/v1/oauth/token`, () => {
        exchanges += 1
        return HttpResponse.json(tokenResponse)
      }),
    )

    render(
      <StrictMode>
        <Providers>
          <AuthCallback />
        </Providers>
      </StrictMode>,
    )

    expect(screen.getByRole("status")).toHaveTextContent("Signing you in…")
    await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/homework/"))
    expect(testRouter.replace).toHaveBeenCalledTimes(1)
    expect(testRouter.push).not.toHaveBeenCalled()
    expect(exchanges).toBe(1)
  })

  it("explains a failed login and starts a new one by hand", async () => {
    setTestRoute("/auth/callback/?error=access_denied&error_description=No")
    const replace = spyOn(navigation, "replace").mockImplementation(() => undefined)
    const user = userEvent.setup()

    render(
      <Providers>
        <AuthCallback />
      </Providers>,
    )

    expect(await screen.findByText("We could not complete the login.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Log in again" }))

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1))
  })
})
