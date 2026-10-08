import { afterEach, describe, expect, it, spyOn } from "bun:test"
import { setSession } from "@ihsp/auth"
import { isMiniApp } from "@ihsp/telegram"
import { apiUrl, problem, renderWithProviders, server, userMe, userPreferences } from "@ihsp/test-utils"
import { AppThemeProvider, ThemeToggle, UserMenu, useThemeChoice } from "@ihsp/ui"
import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import type { ReactNode } from "react"
import { ThemePreferenceSync } from "./theme-preference-sync"
import { THEME_REFETCH_MIN_MS } from "./use-account-theme"

const html = document.documentElement

afterEach(() => {
  html.className = ""
  html.style.colorScheme = ""
})

function Probe() {
  const { theme } = useThemeChoice()
  return <output aria-label="theme">{theme}</output>
}

function App({ children }: { children?: ReactNode }) {
  return (
    <AppThemeProvider>
      <ThemePreferenceSync>
        <Probe />
        {children}
      </ThemePreferenceSync>
    </AppThemeProvider>
  )
}

function accountWith(theme: "light" | "dark" | "system") {
  return { user: { ...userMe, preferences: { ...userPreferences, theme } } }
}

/** Records the bodies of `PATCH /v1/id/me/preferences`. */
function recordPatches(options: { fail?: boolean } = {}): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      if (options.fail) return problem(500, "common/internal", "Something went wrong")
      return HttpResponse.json({ ...userPreferences, ...body })
    }),
  )
  return bodies
}

describe("default theme", () => {
  it("is light on a first visit, before anyone is logged in", async () => {
    renderWithProviders(<App />, { session: null })

    expect(await screen.findByLabelText("theme")).toHaveTextContent("light")
    expect(html.classList.contains("dark")).toBe(false)
    expect(userPreferences.theme).toBe("light")
  })
})

describe("account theme", () => {
  it("is applied when the session loads and cached for the next page load", async () => {
    renderWithProviders(<App />, { session: accountWith("dark") })

    await waitFor(() => expect(html.classList.contains("dark")).toBe(true))
    expect(screen.getByLabelText("theme")).toHaveTextContent("dark")
    expect(window.localStorage.getItem("theme")).toBe("dark")
  })

  it("is applied right after login", async () => {
    renderWithProviders(<App />, { session: null })
    expect(html.classList.contains("dark")).toBe(false)

    act(() =>
      setSession({ access_token: "t", expires_at: Date.now() + 600_000, user: accountWith("dark").user }),
    )

    await waitFor(() => expect(html.classList.contains("dark")).toBe(true))
    expect(window.localStorage.getItem("theme")).toBe("dark")
  })

  it("replaces a stale cached theme of this device", async () => {
    window.localStorage.setItem("theme", "dark")

    renderWithProviders(<App />, { session: accountWith("light") })

    await waitFor(() => expect(window.localStorage.getItem("theme")).toBe("light"))
    expect(html.classList.contains("dark")).toBe(false)
  })

  it("can be system", async () => {
    renderWithProviders(<App />, { session: accountWith("system") })

    await waitFor(() => expect(screen.getByLabelText("theme")).toHaveTextContent("system"))
    expect(window.localStorage.getItem("theme")).toBe("system")
  })

  it("does not rewrite what is already right", async () => {
    const bodies = recordPatches()

    renderWithProviders(<App />, { session: accountWith("light") })
    await screen.findByLabelText("theme")

    expect(bodies).toEqual([])
  })
})

describe("changing the theme", () => {
  it("with the toggle applies it and saves it in the account", async () => {
    const bodies = recordPatches()
    const { user } = renderWithProviders(
      <App>
        <ThemeToggle />
      </App>,
      { session: accountWith("light") },
    )

    await user.click(await screen.findByRole("button", { name: "Toggle light and dark mode" }))

    await waitFor(() => expect(bodies).toEqual([{ theme: "dark" }]))
    expect(html.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem("theme")).toBe("dark")
  })

  it("in the profile menu applies it and saves it in the account", async () => {
    const bodies = recordPatches()
    const { user } = renderWithProviders(
      <App>
        <UserMenu name="Ali" onLogout={() => undefined} />
      </App>,
      { session: accountWith("light") },
    )

    await user.click(await screen.findByRole("button", { name: "Account menu" }))
    await user.click(await screen.findByRole("menuitemradio", { name: "System" }))

    await waitFor(() => expect(bodies).toEqual([{ theme: "system" }]))
    expect(screen.getByLabelText("theme")).toHaveTextContent("system")
  })

  it("before login stays on this device and sends nothing", async () => {
    const bodies = recordPatches()
    const { user } = renderWithProviders(
      <App>
        <ThemeToggle />
      </App>,
      { session: null },
    )

    await user.click(await screen.findByRole("button", { name: "Toggle light and dark mode" }))

    await waitFor(() => expect(html.classList.contains("dark")).toBe(true))
    expect(bodies).toEqual([])
  })

  it("goes back to the account's theme when saving fails", async () => {
    const bodies = recordPatches({ fail: true })
    const { user } = renderWithProviders(
      <App>
        <ThemeToggle />
      </App>,
      { session: accountWith("light") },
    )

    await user.click(await screen.findByRole("button", { name: "Toggle light and dark mode" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    await waitFor(() => expect(html.classList.contains("dark")).toBe(false))
    expect(screen.getByLabelText("theme")).toHaveTextContent("light")
  })
})

describe("theme changed on another platform", () => {
  it("is taken over when this window gets focus again", async () => {
    server.use(
      http.get(apiUrl("/v1/id/me"), () =>
        HttpResponse.json({ ...userMe, preferences: { ...userPreferences, theme: "dark" } }),
      ),
    )
    renderWithProviders(<App />, { session: accountWith("light") })
    await screen.findByLabelText("theme")
    expect(html.classList.contains("dark")).toBe(false)
    const now = Date.now()
    spyOn(Date, "now").mockReturnValue(now + THEME_REFETCH_MIN_MS + 1_000)

    fireEvent.focus(window)

    await waitFor(() => expect(html.classList.contains("dark")).toBe(true))
    expect(window.localStorage.getItem("theme")).toBe("dark")
  })

  it("is not asked for again before a short pause has passed", async () => {
    let asked = 0
    server.use(
      http.get(apiUrl("/v1/id/me"), () => {
        asked += 1
        return HttpResponse.json(userMe)
      }),
    )
    renderWithProviders(<App />, { session: accountWith("light") })
    await screen.findByLabelText("theme")

    fireEvent.focus(window)
    fireEvent.focus(window)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(asked).toBe(0)
  })

  it("is not asked for when nobody is logged in", async () => {
    let asked = 0
    server.use(
      http.get(apiUrl("/v1/id/me"), () => {
        asked += 1
        return HttpResponse.json(userMe)
      }),
    )
    renderWithProviders(<App />, { session: null })
    await screen.findByLabelText("theme")

    fireEvent.focus(window)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(asked).toBe(0)
  })
})

/** Telegram opens a mini app with its launch parameters in the URL hash. */
function openAsMiniApp(): void {
  const data = new URLSearchParams({
    query_id: "AAH",
    user: JSON.stringify({ id: 1, first_name: "A" }),
    auth_date: "1700000000",
    hash: "abc",
    signature: "sig",
  })
  const params = new URLSearchParams({
    tgWebAppData: data.toString(),
    tgWebAppVersion: "8.0",
    tgWebAppPlatform: "tdesktop",
    tgWebAppThemeParams: "{}",
  })
  window.location.hash = `#${params.toString()}`
  // The SDK keeps the launch parameters in sessionStorage; reading them once survives the router resetting the URL.
  expect(isMiniApp()).toBe(true)
}

describe("inside a Telegram mini app", () => {
  afterEach(() => {
    window.location.hash = ""
  })

  it("leaves the theme to Telegram instead of applying the account's", async () => {
    openAsMiniApp()

    renderWithProviders(<App />, { session: accountWith("dark") })
    await screen.findByLabelText("theme")
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(html.classList.contains("dark")).toBe(false)
    expect(window.localStorage.getItem("theme")).toBeNull()
  })

  it("does not ask the account for the theme when the window gets focus", async () => {
    openAsMiniApp()
    let asked = 0
    server.use(
      http.get(apiUrl("/v1/id/me"), () => {
        asked += 1
        return HttpResponse.json(userMe)
      }),
    )
    renderWithProviders(<App />, { session: accountWith("light") })
    await screen.findByLabelText("theme")
    spyOn(Date, "now").mockReturnValue(Date.now() + THEME_REFETCH_MIN_MS + 1_000)

    fireEvent.focus(window)
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(asked).toBe(0)
  })
})
