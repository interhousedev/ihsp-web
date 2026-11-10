/** The landing page renders its hero, CTAs, feature sections and the footer contact from the runtime config. */
import { afterEach, describe, expect, test } from "bun:test"
import { resetConfig } from "@ihsp/config"
import { I18nTestProvider } from "@ihsp/i18n"
import { TEST_ENV } from "@ihsp/test-utils"
import { render, screen, waitFor } from "@testing-library/react"
import { LANDING_MESSAGES } from "../app/providers"
import { LandingPage } from "../features/landing/landing-page"
import { botUrl } from "../features/landing/links"

function renderLanding() {
  return render(
    <I18nTestProvider messages={LANDING_MESSAGES.en}>
      <LandingPage />
    </I18nTestProvider>,
  )
}

afterEach(() => {
  window.__ENV__ = { ...TEST_ENV }
  resetConfig()
})

const SECTION_HEADINGS = [
  "Your day at a glance",
  "Timetable and marks without asking around",
  "An AI assistant and notebooks that learn with you",
  "A journal that saves teachers' time",
  "Library and courses in the same place",
  "Telegram bot and mini app",
  "Excuses with a clear status",
  "Everything the lyceum needs in one account",
  "Ready to start?",
]

describe("LandingPage", () => {
  test("renders the hero, the CTAs and every section", async () => {
    window.__ENV__ = { ...TEST_ENV, BOT_USERNAME: "ihtbot", SECURITY_CONTACT: "sec@example.org, @sec_team (Telegram)" }
    resetConfig()
    renderLanding()

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Everyday school life in one app")
    expect(screen.getAllByRole("img", { name: "Interhouse logo" }).length).toBeGreaterThan(0)
    for (const name of SECTION_HEADINGS) {
      expect(screen.getByRole("heading", { name })).toBeTruthy()
    }
    const bots = screen.getAllByRole("link", { name: "Open the Telegram bot" })
    await waitFor(() => expect(bots[0]?.getAttribute("href")).toBe("https://t.me/ihtbot"))
    const signIn = screen.getAllByRole("link", { name: /^Sign in/ })
    expect(signIn.length).toBeGreaterThan(1)
    for (const link of signIn) expect(link.getAttribute("href")).toBe(`${TEST_ENV.SP_URL}/`)
    expect(screen.getByRole("link", { name: "sec@example.org" }).getAttribute("href")).toBe("mailto:sec@example.org")
    expect(screen.getByRole("link", { name: "@sec_team" }).getAttribute("href")).toBe("https://t.me/sec_team")
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy()
  })

  test("hides the security contact when it is empty", () => {
    window.__ENV__ = { ...TEST_ENV, SECURITY_CONTACT: "" }
    resetConfig()
    renderLanding()
    expect(screen.queryByText(/Security contact/)).toBeNull()
  })

  test("botUrl drops a leading @", () => {
    expect(botUrl("@ihspbot")).toBe("https://t.me/ihspbot")
  })
})
