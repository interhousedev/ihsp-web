/** WEB-17, ID-17: the Appearance setting of the account pages (light / dark / system, saved in the account). */
import { afterEach, describe, expect, test } from "bun:test"
import { apiUrl, server, userMe, userPreferences } from "@ihsp/test-utils"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { AppThemeProvider } from "@ihsp/ui"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { buildIdNav } from "../config/nav"
import { AppearancePage } from "../features/appearance/components/appearance-page"
import { SecurityPage } from "../features/security/components/security-page"
import { LOGGED_IN, allowSlowTests, findLink, renderId } from "./helpers"

allowSlowTests()

afterEach(() => {
  document.documentElement.className = ""
})

function recordPatches(): Record<string, unknown>[] {
  const bodies: Record<string, unknown>[] = []
  server.use(
    http.patch(apiUrl("/v1/id/me/preferences"), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return HttpResponse.json({ ...userPreferences, ...body })
    }),
  )
  return bodies
}

function renderPage(theme: "light" | "dark" | "system" = "light") {
  return renderId(
    <AppThemeProvider>
      <ThemePreferenceSync>
        <AppearancePage />
      </ThemePreferenceSync>
    </AppThemeProvider>,
    { route: "/appearance/", session: { user: { ...userMe, preferences: { ...userPreferences, theme } } } },
  )
}

describe("appearance page", () => {
  test("offers Light, Dark and System and shows the account's choice", async () => {
    renderPage("dark")

    expect(await screen.findByRole("radio", { name: /Light/, hidden: true })).toBeInTheDocument()
    expect(await screen.findByRole("radio", { name: /Dark/, hidden: true })).toBeChecked()
    expect(screen.getByRole("radio", { name: /System/, hidden: true })).not.toBeChecked()
  })

  test("choosing a theme applies it and saves it in the account", async () => {
    const bodies = recordPatches()
    const { user } = renderPage("light")

    await user.click(await screen.findByRole("radio", { name: /Dark/, hidden: true }))

    await waitFor(() => expect(bodies).toEqual([{ theme: "dark" }]))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(screen.getByRole("radio", { name: /Dark/, hidden: true })).toBeChecked()
  })
})

describe("navigation to the page", () => {
  test("the sidebar lists Appearance for everybody, under Account", () => {
    const labels = (roles: string[]) =>
      buildIdNav(((key: string) => key) as never)
        .flatMap((group) => group.items)
        .filter((item) => !item.roles || item.roles.some((role) => roles.includes(role)))
        .map((item) => item.url)

    expect(labels(["teacher"])).toContain("/appearance/")
    expect(labels(["student"])).toContain("/appearance/")
  })

  test("the security overview has an Appearance card", async () => {
    renderId(<SecurityPage />, { route: "/security/", session: LOGGED_IN })

    expect((await findLink(/Appearance/)).getAttribute("href")).toMatch(/^\/appearance\/?$/)
  })
})
