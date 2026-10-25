/** The landing page renders its hero, CTAs, sections, screenshots and the footer contact from the runtime config. */
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

describe("LandingPage", () => {
  test("renders the hero, the CTAs and every section", async () => {
    window.__ENV__ = { ...TEST_ENV, BOT_USERNAME: "ihtbot", SECURITY_CONTACT: "sec@example.org, @sec_team (Telegram)" }
    resetConfig()
    renderLanding()

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Making everyday studying at Interhouse more convenient",
    )
    expect(screen.getByRole("img", { name: "Interhouse logo" })).toBeTruthy()
    const apply = screen.getByRole("link", { name: /Want to apply to Interhouse/ })
    await waitFor(() => expect(apply.getAttribute("href")).toBe("https://t.me/ihtbot"))
    expect(screen.getAllByRole("link", { name: "Open my.iht" })[0]?.getAttribute("href")).toBe(`${TEST_ENV.SP_URL}/`)
    expect(screen.getByRole("heading", { name: "Why my.iht?" })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "How my.iht helps you study" })).toBeTruthy()
    expect(screen.getAllByRole("img", { name: /^Screenshot of / }).length).toBe(7)
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
